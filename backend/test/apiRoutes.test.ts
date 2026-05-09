import { describe, expect, it } from "vitest";
import { buildApp } from "../src/api/app.js";

describe("API routes", () => {
  it("returns vehicles", async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: "GET", url: "/api/vehicles" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { id: "tesla-model-3-long-range", name: "Tesla Model 3 Long Range", officialRangeKm: 548 }
    ]);
    await app.close();
  });

  it("validates route planning input", async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/routes/plan",
      payload: { start: { lat: 999, lng: 1 } }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
    await app.close();
  });

  it("returns route plan responses from the planner", async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/routes/plan",
      payload: {
        start: { lat: 10.7, lng: 106.7 },
        destination: { lat: 10.8, lng: 106.8 },
        vehicleModelId: "tesla-model-3-long-range",
        currentBatteryPercent: 80
      }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().legs[0].to).toBe("Destination");
    await app.close();
  });

  it("returns stations near a point", async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: "GET", url: "/api/stations?lat=10.7&lng=106.7" });
    expect(response.statusCode).toBe(200);
    expect(response.json()[0].name).toBe("Station");
    await app.close();
  });
});

async function buildTestApp() {
  return buildApp({
    checkDatabase: async () => undefined,
    defaultStationSearchRadiusKm: 5,
    vehicleRepository: {
      listVehicles: async () => [
        { id: "tesla-model-3-long-range", name: "Tesla Model 3 Long Range", officialRangeKm: 548 }
      ]
    },
    stationRepository: {
      findStationsNearPoint: async () => [
        {
          id: "1",
          provider: "google_my_maps",
          providerStationId: "1",
          name: "Station",
          address: null,
          lat: 10.7,
          lng: 106.7,
          status: "Đang hoạt động"
        }
      ]
    },
    routePlanner: {
      planRoute: async () => ({
        routeGeometry: { type: "LineString", coordinates: [[106.7, 10.7], [106.8, 10.8]] },
        chargingStops: [],
        legs: [{ from: "Start", to: "Destination", distanceKm: 10, estimatedArrivalBatteryPercent: 78 }],
        summary: { totalDistanceKm: 10, totalDurationSeconds: 900, chargingStopCount: 0 },
        warnings: []
      })
    }
  });
}
