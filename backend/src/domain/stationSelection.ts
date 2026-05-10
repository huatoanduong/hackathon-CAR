import { RoutePlanningError } from "../api/errors.js";
import type { ChargingStation, RouteCandidate, RouteGeometry, RoutingRoute, SearchWindow } from "./types.js";
import type { Coordinate } from "./types.js";
import type { RoutingProvider } from "../providers/routingProvider.js";
import { estimateArrivalBatteryPercent } from "./battery.js";
import { nearestProgressKm } from "./routeGeometry.js";

const MAX_ROUTED_CANDIDATES = 6;
const MAX_CONCURRENT_ROUTE_CHECKS = 2;

export async function selectBestStation({
  stations,
  routeGeometry,
  currentPoint,
  destination,
  directRoute,
  currentBatteryPercent,
  officialRangeKm,
  thresholdPercent,
  window,
  routingProvider
}: {
  stations: ChargingStation[];
  routeGeometry: RouteGeometry;
  currentPoint: Coordinate;
  destination: Coordinate;
  directRoute: RoutingRoute;
  currentBatteryPercent: number;
  officialRangeKm: number;
  thresholdPercent: number;
  window: SearchWindow;
  routingProvider: RoutingProvider;
}): Promise<RouteCandidate | null> {
  const candidates: RouteCandidate[] = [];
  const prefilteredStations = stations
    .map((station) => ({
      station,
      routeProgressKm: station.routeProgressKm ?? nearestProgressKm(routeGeometry, station)
    }))
    .filter(({ routeProgressKm }) => routeProgressKm > 0.2)
    .sort((a, b) => {
      const distanceDelta = (a.station.distanceKm ?? 0) - (b.station.distanceKm ?? 0);
      if (Math.abs(distanceDelta) > 0.2) return distanceDelta;
      return b.routeProgressKm - a.routeProgressKm;
    })
    .slice(0, MAX_ROUTED_CANDIDATES);

  await runWithConcurrency(prefilteredStations, MAX_CONCURRENT_ROUTE_CHECKS, async ({ station, routeProgressKm }) => {
    const stationPoint = { lat: station.lat, lng: station.lng };
    try {
      const [toStation, stationToDestination] = await Promise.all([
        routingProvider.getRoute([currentPoint, stationPoint]),
        routingProvider.getRoute([stationPoint, destination])
      ]);
      const batteryBeforeChargingPercent = estimateArrivalBatteryPercent(
        currentBatteryPercent,
        toStation.distanceKm,
        officialRangeKm
      );
      if (batteryBeforeChargingPercent < 20 || batteryBeforeChargingPercent > currentBatteryPercent) return;

      const detourDurationSeconds =
        toStation.durationSeconds + stationToDestination.durationSeconds - directRoute.durationSeconds;
      candidates.push({
        station,
        detourDurationSeconds,
        routeProgressKm,
        batteryBeforeChargingPercent,
        selectedEarlierThanThreshold: !window.preferred || batteryBeforeChargingPercent > thresholdPercent
      });
    } catch (error) {
      if (error instanceof RoutePlanningError) throw error;
    }
  });

  candidates.sort((a, b) => a.detourDurationSeconds - b.detourDurationSeconds);
  return candidates[0] ?? null;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}
