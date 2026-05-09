import { describe, expect, it } from "vitest";
import { RoutingProviderError } from "../src/api/errors.js";
import { parseOsrmRoute } from "../src/providers/osrmClient.js";

describe("parseOsrmRoute", () => {
  it("parses distance, duration, and geometry", () => {
    const route = parseOsrmRoute({
      code: "Ok",
      routes: [
        {
          distance: 12345,
          duration: 678,
          geometry: { type: "LineString", coordinates: [[106.7, 10.7], [106.8, 10.8]] }
        }
      ]
    });

    expect(route.distanceKm).toBe(12.345);
    expect(route.durationSeconds).toBe(678);
    expect(route.geometry.coordinates).toHaveLength(2);
  });

  it("maps malformed responses to provider errors", () => {
    expect(() => parseOsrmRoute({ code: "Ok", routes: [] })).toThrow(RoutingProviderError);
  });
});
