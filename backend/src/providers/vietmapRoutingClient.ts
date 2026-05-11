import { RoutingProviderError } from "../api/errors.js";
import type { Coordinate, RouteGeometry, RoutingRoute } from "../domain/types.js";
import { metersToKm } from "../utils/geo.js";
import type { RoutingProvider } from "./routingProvider.js";

type VietmapRoutePath = {
  distance?: number;
  time?: number;
  points?: RouteGeometry;
};

type VietmapRouteResponse = {
  code?: string;
  paths?: VietmapRoutePath[];
};

export class VietmapRoutingClient implements RoutingProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number
  ) {}

  async getRoute(points: Coordinate[]): Promise<RoutingRoute> {
    if (points.length < 2) {
      throw new RoutingProviderError("At least two coordinates are required for routing");
    }

    const fullRoute = await this.getRouteForPoints(points);
    const legs = await Promise.all(
      points.slice(0, -1).map((point, index) =>
        this.getRouteForPoints([point, points[index + 1]])
      )
    );

    return {
      ...fullRoute,
      legs: legs.map((leg) => ({
        distanceKm: leg.distanceKm,
        durationSeconds: leg.durationSeconds
      }))
    };
  }

  private async getRouteForPoints(points: Coordinate[]): Promise<RoutingRoute> {
    const url = new URL("/api/route", this.baseUrl);
    url.searchParams.set("api-version", "1.1");
    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("vehicle", "car");
    url.searchParams.set("points_encoded", "false");
    points.forEach((point) => {
      url.searchParams.append("point", `${point.lat},${point.lng}`);
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new RoutingProviderError(`Vietmap routing returned HTTP ${response.status}`);
      }
      const payload = await response.json();
      return parseVietmapRoute(payload);
    } catch (error) {
      if (error instanceof RoutingProviderError) throw error;
      throw new RoutingProviderError(error instanceof Error ? error.message : "Vietmap routing request failed");
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function parseVietmapRoute(payload: unknown): RoutingRoute {
  const data = payload as VietmapRouteResponse;
  const path = data.paths?.[0];

  if (data.code && data.code !== "OK") {
    throw new RoutingProviderError(`Vietmap routing returned ${data.code}`);
  }
  if (
    !path ||
    typeof path.distance !== "number" ||
    typeof path.time !== "number" ||
    path.points?.type !== "LineString" ||
    !Array.isArray(path.points.coordinates)
  ) {
    throw new RoutingProviderError("Vietmap routing returned a malformed route");
  }

  return {
    distanceKm: metersToKm(path.distance),
    durationSeconds: path.time / 1000,
    geometry: path.points
  };
}
