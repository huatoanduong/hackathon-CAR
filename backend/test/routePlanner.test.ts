import { describe, expect, it } from "vitest";
import { RoutePlanningError } from "../src/api/errors.js";
import { RoutePlannerService } from "../src/domain/routePlanner.js";
import type { ChargingStation, Coordinate, RoutingRoute } from "../src/domain/types.js";
import type { RoutingProvider } from "../src/providers/routingProvider.js";

describe("RoutePlannerService", () => {
  it("returns a direct route when arrival battery is safe", async () => {
    const planner = new RoutePlannerService(
      vehicleRepo(500),
      stationRepo([]),
      routeProvider([{ distanceKm: 100, durationSeconds: 1000, geometry: line(start, dest) }])
    );

    const result = await planner.planRoute(baseInput());
    expect(result.chargingStops).toHaveLength(0);
    expect(result.legs[0].estimatedArrivalBatteryPercent).toBe(60);
  });

  it("adds one charging stop when destination is not directly safe", async () => {
    const station = stationAt("1", { lat: 0.5, lng: 0 });
    const provider = routeProvider([
      { distanceKm: 400, durationSeconds: 4000, geometry: line(start, dest) },
      { distanceKm: 180, durationSeconds: 1800, geometry: line(start, station) },
      { distanceKm: 170, durationSeconds: 1700, geometry: line(station, dest) },
      { distanceKm: 170, durationSeconds: 1700, geometry: line(station, dest) },
      { distanceKm: 350, durationSeconds: 3500, geometry: line(start, station, dest) },
      { distanceKm: 180, durationSeconds: 1800, geometry: line(start, station) },
      { distanceKm: 170, durationSeconds: 1700, geometry: line(station, dest) }
    ]);
    const planner = new RoutePlannerService(vehicleRepo(500), stationRepo([station]), provider);

    const result = await planner.planRoute(baseInput({ currentBatteryPercent: 60 }));
    expect(result.chargingStops[0].stationId).toBe("1");
    expect(result.legs).toHaveLength(2);
  });

  it("fails when no reachable station exists", async () => {
    const planner = new RoutePlannerService(
      vehicleRepo(500),
      stationRepo([]),
      routeProvider([{ distanceKm: 500, durationSeconds: 5000, geometry: line(start, dest) }])
    );
    await expect(planner.planRoute(baseInput({ currentBatteryPercent: 50 }))).rejects.toThrow(RoutePlanningError);
  });
});

const start: Coordinate = { lat: 0, lng: 0 };
const dest: Coordinate = { lat: 1, lng: 0 };

function baseInput(overrides: Partial<Parameters<RoutePlannerService["planRoute"]>[0]> = {}) {
  return {
    start,
    destination: dest,
    vehicleModelId: "vehicle",
    currentBatteryPercent: 80,
    chargeThresholdPercent: 30,
    ...overrides
  };
}

function vehicleRepo(rangeKm: number) {
  return {
    findVehicleById: async () => ({ id: "vehicle", name: "Vehicle", officialRangeKm: rangeKm })
  } as ConstructorParameters<typeof RoutePlannerService>[0];
}

function stationRepo(stations: ChargingStation[]) {
  return {
    findStationsNearRoutePoints: async () => stations
  } as ConstructorParameters<typeof RoutePlannerService>[1];
}

function routeProvider(routes: RoutingRoute[]): RoutingProvider {
  let index = 0;
  return {
    getRoute: async () => routes[Math.min(index++, routes.length - 1)]
  };
}

function stationAt(id: string, point: Coordinate): ChargingStation {
  return {
    id,
    provider: "test",
    providerStationId: id,
    name: `Station ${id}`,
    address: null,
    lat: point.lat,
    lng: point.lng,
    status: null
  };
}

function line(...points: Coordinate[]) {
  return {
    type: "LineString" as const,
    coordinates: points.map((point) => [point.lng, point.lat] as [number, number])
  };
}
