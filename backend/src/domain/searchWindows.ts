import type { SearchWindow } from "./types.js";

export function buildSearchWindows(
  currentBatteryPercent: number,
  chargeThresholdPercent: number
): SearchWindow[] {
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
