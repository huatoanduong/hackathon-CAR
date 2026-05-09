import { RoutePlanningError } from "../api/errors.js";
import type { ChargingStation, RouteCandidate, RouteGeometry, RoutingRoute, SearchWindow } from "./types.js";
import type { Coordinate } from "./types.js";
import type { RoutingProvider } from "../providers/routingProvider.js";
import { estimateArrivalBatteryPercent } from "./battery.js";
import { nearestProgressKm } from "./routeGeometry.js";

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

  for (const station of stations) {
    const stationPoint = { lat: station.lat, lng: station.lng };
    const routeProgressKm = station.routeProgressKm ?? nearestProgressKm(routeGeometry, stationPoint);
    if (routeProgressKm <= 0.2) continue;

    try {
      const toStation = await routingProvider.getRoute([currentPoint, stationPoint]);
      const batteryBeforeChargingPercent = estimateArrivalBatteryPercent(
        currentBatteryPercent,
        toStation.distanceKm,
        officialRangeKm
      );
      if (batteryBeforeChargingPercent < 20 || batteryBeforeChargingPercent > currentBatteryPercent) continue;

      const stationToDestination = await routingProvider.getRoute([stationPoint, destination]);
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
  }

  candidates.sort((a, b) => a.detourDurationSeconds - b.detourDurationSeconds);
  return candidates[0] ?? null;
}
