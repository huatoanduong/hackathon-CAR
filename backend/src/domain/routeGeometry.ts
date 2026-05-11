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
  const routePoints = cumulativeRoutePoints(geometry);
  if (routePoints.length === 0) return 0;
  if (routePoints.length === 1) return routePoints[0].progressKm;

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestProgress = 0;

  for (let index = 1; index < routePoints.length; index += 1) {
    const start = routePoints[index - 1];
    const end = routePoints[index];
    const segmentLengthKm = end.progressKm - start.progressKm;
    if (segmentLengthKm <= 0) continue;

    const projected = projectPointToSegment(point, start, end);
    const progressKm = start.progressKm + segmentLengthKm * projected.t;
    const distance = projected.distanceKm;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestProgress = progressKm;
    }
  }

  return bestProgress;
}

function projectPointToSegment(point: Coordinate, start: Coordinate, end: Coordinate) {
  const latScaleKm = 111.32;
  const lngScaleKm = 111.32 * Math.cos((start.lat * Math.PI) / 180);
  const px = (point.lng - start.lng) * lngScaleKm;
  const py = (point.lat - start.lat) * latScaleKm;
  const sx = 0;
  const sy = 0;
  const ex = (end.lng - start.lng) * lngScaleKm;
  const ey = (end.lat - start.lat) * latScaleKm;
  const dx = ex - sx;
  const dy = ey - sy;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSquared));
  const projectedX = sx + dx * t;
  const projectedY = sy + dy * t;
  const distanceKm = Math.hypot(px - projectedX, py - projectedY);

  return { distanceKm, t };
}
