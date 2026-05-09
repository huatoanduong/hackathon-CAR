import type { Coordinate } from "../domain/types.js";

const EARTH_RADIUS_KM = 6371;

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function metersToKm(value: number): number {
  return value / 1000;
}

export function kmToMeters(value: number): number {
  return value * 1000;
}

export function assertValidCoordinate(point: Coordinate): void {
  if (point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180) {
    throw new Error("Invalid coordinate");
  }
}
