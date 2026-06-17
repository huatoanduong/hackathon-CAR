import type { SearchWindow } from "./types.js";

export function buildSearchWindows(
  currentBatteryPercent: number,
  chargeThresholdPercent: number,
  options: { emergencyMinBatteryPercent?: number } = {}
): SearchWindow[] {
  if (
    options.emergencyMinBatteryPercent !== undefined &&
    currentBatteryPercent <= chargeThresholdPercent
  ) {
    return [
      {
        minBatteryPercent: Math.max(0, options.emergencyMinBatteryPercent),
        maxBatteryPercent: currentBatteryPercent,
        preferred: false
      }
    ].filter((window) => window.minBatteryPercent < currentBatteryPercent);
  }

  const windows: SearchWindow[] = [
    {
      minBatteryPercent: 20,
      maxBatteryPercent: chargeThresholdPercent,
      preferred: true
    }
  ];

  let upper = Math.min(100, Math.floor(currentBatteryPercent / 10) * 10);
  let lower = Math.max(chargeThresholdPercent, 40);

  while (lower <= upper) {
    const minBatteryPercent = lower === 40 ? chargeThresholdPercent : lower - 10;
    const maxBatteryPercent = lower;
    if (maxBatteryPercent > chargeThresholdPercent) {
      windows.push({
        minBatteryPercent,
        maxBatteryPercent,
        preferred: false
      });
    }
    lower += 10;
  }

  return windows.filter((window) => window.minBatteryPercent < currentBatteryPercent);
}
