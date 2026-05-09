import type { Coordinate, RouteGeometry } from "./types.js";
import { haversineDistanceKm } from "../utils/geo.js";

export type RoutePointWithProgress = Coordinate & {
  progressKm: number;
};

export function coordinatesFromGeometry(geometry: RouteGeometry): Coordinate[] {
  return geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export function geometryFromCoordinates(points: Coordinate[]): RouteGeometry {
  return {
    type: "LineString",
    coordinates: points.map((point) => [point.lng, point.lat])
  };
}

export function cumulativeRoutePoints(geometry: RouteGeometry): RoutePointWithProgress[] {
  const points = coordinatesFromGeometry(geometry);
  let progressKm = 0;
  return points.map((point, index) => {
    if (index > 0) {
      progressKm += haversineDistanceKm(points[index - 1], point);
    }
    return { ...point, progressKm };
  });
}

export function findPointAtDistance(geometry: RouteGeometry, targetDistanceKm: number): RoutePointWithProgress {
  const points = cumulativeRoutePoints(geometry);
  if (points.length === 0) return { lat: 0, lng: 0, progressKm: 0 };
  return points.find((point) => point.progressKm >= targetDistanceKm) ?? points[points.length - 1];
}

export function routePointsBetweenDistances(
  geometry: RouteGeometry,
  startDistanceKm: number,
  endDistanceKm: number
): RoutePointWithProgress[] {
  const low = Math.min(startDistanceKm, endDistanceKm);
  const high = Math.max(startDistanceKm, endDistanceKm);
  const points = cumulativeRoutePoints(geometry).filter(
    (point) => point.progressKm >= low && point.progressKm <= high
  );
  if (points.length > 0) return sampleRoutePoints(points, 24);
  return [findPointAtDistance(geometry, low), findPointAtDistance(geometry, high)];
}

export function sampleRoutePoints<T>(points: T[], maxCount: number): T[] {
  if (points.length <= maxCount) return points;
  const step = (points.length - 1) / (maxCount - 1);
  return Array.from({ length: maxCount }, (_, index) => points[Math.round(index * step)]);
}

export function nearestProgressKm(geometry: RouteGeometry, point: Coordinate): number {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestProgress = 0;
  for (const routePoint of cumulativeRoutePoints(geometry)) {
    const distance = haversineDistanceKm(routePoint, point);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestProgress = routePoint.progressKm;
    }
  }
  return bestProgress;
}
