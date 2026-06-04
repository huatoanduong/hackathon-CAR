import type { Coordinate, RoutingRoute } from "../domain/types.js";

export interface RoutingProvider {
  getRoute(points: Coordinate[]): Promise<RoutingRoute>;
}
