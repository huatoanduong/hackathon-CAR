const roundPercent = (value: number) => Math.round(Math.max(0, Math.min(100, value)));

export function estimateBatteryUsedPercent(distanceKm: number, officialRangeKm: number): number {
  if (officialRangeKm <= 0) return 100;
  return roundPercent((distanceKm / officialRangeKm) * 100);
}

export function estimateArrivalBatteryPercent(
  startBatteryPercent: number,
  distanceKm: number,
  officialRangeKm: number
): number {
  const used = (distanceKm / officialRangeKm) * 100;
  return roundPercent(startBatteryPercent - used);
}

export function distanceReachableKm(
  startBatteryPercent: number,
  targetBatteryPercent: number,
  officialRangeKm: number
): number {
  const usablePercent = Math.max(0, startBatteryPercent - targetBatteryPercent);
  return (usablePercent / 100) * officialRangeKm;
}

export function clampBatteryPercent(value: number): number {
  return roundPercent(value);
}
