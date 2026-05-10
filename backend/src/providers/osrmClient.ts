import { RoutingProviderError } from "../api/errors.js";
import type { Coordinate, RouteGeometry, RoutingRoute } from "../domain/types.js";
import { metersToKm } from "../utils/geo.js";
import type { RoutingProvider } from "./routingProvider.js";

export class OsrmClient implements RoutingProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number
  ) {}

  async getRoute(points: Coordinate[]): Promise<RoutingRoute> {
    if (points.length < 2) {
      throw new RoutingProviderError("At least two coordinates are required for routing");
    }
    const coords = points.map((point) => `${point.lng},${point.lat}`).join(";");
    const url = new URL(`/route/v1/driving/${coords}`, this.baseUrl);
    url.searchParams.set("overview", "full");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("steps", "false");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new RoutingProviderError(`Routing provider returned HTTP ${response.status}`);
      }
      const payload = await response.json();
      return parseOsrmRoute(payload);
    } catch (error) {
      if (error instanceof RoutingProviderError) throw error;
      throw new RoutingProviderError(error instanceof Error ? error.message : "Routing provider request failed");
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function parseOsrmRoute(payload: unknown): RoutingRoute {
  const data = payload as {
    code?: string;
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: RouteGeometry;
      legs?: Array<{
        distance?: number;
        duration?: number;
      }>;
    }>;
  };
  const route = data.routes?.[0];
  if (data.code && data.code !== "Ok") {
    throw new RoutingProviderError(`Routing provider returned ${data.code}`);
  }
  if (
    !route ||
    typeof route.distance !== "number" ||
    typeof route.duration !== "number" ||
    route.geometry?.type !== "LineString" ||
    !Array.isArray(route.geometry.coordinates)
  ) {
    throw new RoutingProviderError("Routing provider returned a malformed route");
  }

  return {
    distanceKm: metersToKm(route.distance),
    durationSeconds: route.duration,
    geometry: route.geometry,
    legs: route.legs?.map((leg) => ({
      distanceKm: metersToKm(Number(leg.distance ?? 0)),
      durationSeconds: Number(leg.duration ?? 0)
    }))
  };
}
