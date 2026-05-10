import { NotFoundError, RoutePlanningError } from "../api/errors.js";
import type { StationRepository } from "../db/repositories/stationRepository.js";
import type { VehicleRepository } from "../db/repositories/vehicleRepository.js";
import type { RoutingProvider } from "../providers/routingProvider.js";
import { clampBatteryPercent, distanceReachableKm, estimateArrivalBatteryPercent } from "./battery.js";
import { routePointsBetweenDistances } from "./routeGeometry.js";
import { buildSearchWindows } from "./searchWindows.js";
import { selectBestStation } from "./stationSelection.js";
import type { ChargingStation, Coordinate, PlanRouteInput, PlanRouteResult } from "./types.js";

const DESTINATION_MIN_BATTERY_PERCENT = 20;
const POST_CHARGE_BATTERY_PERCENT = 80;
const MAX_PLANNING_ITERATIONS = 8;

export class RoutePlannerService {
  constructor(
    private readonly vehicleRepository: Pick<VehicleRepository, "findVehicleById">,
    private readonly stationRepository: Pick<StationRepository, "findStationsNearRoutePoints">,
    private readonly routingProvider: RoutingProvider,
    private readonly routeCorridorRadiusKm = 3
  ) {}

  async planRoute(input: PlanRouteInput): Promise<PlanRouteResult> {
    const vehicle = await this.vehicleRepository.findVehicleById(input.vehicleModelId);
    if (!vehicle) throw new NotFoundError(`Vehicle not found: ${input.vehicleModelId}`);

    const selectedStations: ChargingStation[] = [];
    const chargingStops: PlanRouteResult["chargingStops"] = [];
    const warnings: string[] = [];
    let currentPoint = input.start;
    let currentBatteryPercent = input.currentBatteryPercent;

    for (let iteration = 0; iteration < MAX_PLANNING_ITERATIONS; iteration += 1) {
      const directRoute = await this.routingProvider.getRoute([currentPoint, input.destination]);
      const destinationBattery = estimateArrivalBatteryPercent(
        currentBatteryPercent,
        directRoute.distanceKm,
        vehicle.officialRangeKm
      );
      if (destinationBattery >= DESTINATION_MIN_BATTERY_PERCENT) {
        return this.buildResult({
          start: input.start,
          destination: input.destination,
          selectedStations,
          chargingStops,
          vehicleRangeKm: vehicle.officialRangeKm,
          initialBatteryPercent: input.currentBatteryPercent,
          warnings
        });
      }

      const candidate = await this.findNextStop({
        directRoute,
        currentPoint,
        destination: input.destination,
        currentBatteryPercent,
        officialRangeKm: vehicle.officialRangeKm,
        thresholdPercent: input.chargeThresholdPercent,
        excludeStationIds: selectedStations.map((station) => station.id)
      });

      if (!candidate) {
        throw new RoutePlanningError("No reachable charging station found in the safe route window");
      }

      selectedStations.push(candidate.station);
      chargingStops.push({
        stationId: candidate.station.id,
        name: candidate.station.name,
        address: candidate.station.address,
        status: candidate.station.status,
        accessInfo: candidate.station.accessInfo,
        connectorSummary: candidate.station.connectorSummary,
        connectorCount: candidate.station.connectorCount,
        maxPowerKw: candidate.station.maxPowerKw,
        powerLevelsKw: candidate.station.powerLevelsKw,
        lat: candidate.station.lat,
        lng: candidate.station.lng,
        batteryBeforeChargingPercent: clampBatteryPercent(candidate.batteryBeforeChargingPercent),
        batteryAfterChargingPercent: POST_CHARGE_BATTERY_PERCENT,
        selectionReason: candidate.selectedEarlierThanThreshold
          ? "Selected earlier because no better charger was available later in the safe window."
          : "Lowest detour time within the safe battery window."
      });
      if (candidate.selectedEarlierThanThreshold) {
        warnings.push(`Charging stop ${candidate.station.name} was selected earlier than the preferred threshold.`);
      }
      currentPoint = { lat: candidate.station.lat, lng: candidate.station.lng };
      currentBatteryPercent = POST_CHARGE_BATTERY_PERCENT;
    }

    throw new RoutePlanningError("Route planning exceeded the maximum number of charging stops");
  }

  private async findNextStop({
    directRoute,
    currentPoint,
    destination,
    currentBatteryPercent,
    officialRangeKm,
    thresholdPercent,
    excludeStationIds
  }: {
    directRoute: Awaited<ReturnType<RoutingProvider["getRoute"]>>;
    currentPoint: Coordinate;
    destination: Coordinate;
    currentBatteryPercent: number;
    officialRangeKm: number;
    thresholdPercent: number;
    excludeStationIds: string[];
  }) {
    const windows = buildSearchWindows(currentBatteryPercent, thresholdPercent);
    for (const window of windows) {
      const windowStartKm = distanceReachableKm(currentBatteryPercent, window.maxBatteryPercent, officialRangeKm);
      const windowEndKm = distanceReachableKm(currentBatteryPercent, window.minBatteryPercent, officialRangeKm);
      const points = routePointsBetweenDistances(directRoute.geometry, windowStartKm, windowEndKm);
      const stations = await this.stationRepository.findStationsNearRoutePoints({
        points,
        radiusKm: this.routeCorridorRadiusKm,
        excludeStationIds,
        limit: 30
      });
      const candidate = await selectBestStation({
        stations,
        routeGeometry: directRoute.geometry,
        currentPoint,
        destination,
        directRoute,
        currentBatteryPercent,
        officialRangeKm,
        thresholdPercent,
        window,
        routingProvider: this.routingProvider
      });
      if (candidate) return candidate;
    }
    return null;
  }

  private async buildResult({
    start,
    destination,
    selectedStations,
    chargingStops,
    vehicleRangeKm,
    initialBatteryPercent,
    warnings
  }: {
    start: Coordinate;
    destination: Coordinate;
    selectedStations: ChargingStation[];
    chargingStops: PlanRouteResult["chargingStops"];
    vehicleRangeKm: number;
    initialBatteryPercent: number;
    warnings: string[];
  }): Promise<PlanRouteResult> {
    const waypoints = [
      start,
      ...selectedStations.map((station) => ({ lat: station.lat, lng: station.lng })),
      destination
    ];
    const fullRoute = await this.routingProvider.getRoute(waypoints);
    const legs: PlanRouteResult["legs"] = [];
    let battery = initialBatteryPercent;
    let totalDistanceKm = 0;
    let totalDurationSeconds = 0;

    for (let index = 0; index < waypoints.length - 1; index += 1) {
      const routeLeg = fullRoute.legs?.[index];
      if (!routeLeg) throw new RoutePlanningError("Routing provider returned missing route leg data");
      const distanceKm = routeLeg.distanceKm;
      const arrivalBattery = estimateArrivalBatteryPercent(battery, distanceKm, vehicleRangeKm);
      totalDistanceKm += distanceKm;
      totalDurationSeconds += routeLeg.durationSeconds;
      legs.push({
        from: index === 0 ? "Start" : selectedStations[index - 1].name,
        to: index === selectedStations.length ? "Destination" : selectedStations[index].name,
        distanceKm: Number(distanceKm.toFixed(1)),
        estimatedArrivalBatteryPercent: arrivalBattery
      });
      battery = index < selectedStations.length ? POST_CHARGE_BATTERY_PERCENT : arrivalBattery;
    }

    return {
      routeGeometry: fullRoute.geometry,
      chargingStops,
      legs,
      summary: {
        totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
        totalDurationSeconds: Math.round(totalDurationSeconds),
        chargingStopCount: chargingStops.length
      },
      warnings
    };
  }
}
