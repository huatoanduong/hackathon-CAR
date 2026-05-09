import { describe, expect, it } from "vitest";
import { buildSearchWindows } from "../src/domain/searchWindows.js";

describe("search windows", () => {
  it("starts with the preferred threshold window", () => {
    expect(buildSearchWindows(80, 30)[0]).toEqual({
      minBatteryPercent: 20,
      maxBatteryPercent: 30,
      preferred: true
    });
  });

  it("adds fallback windows earlier in the route", () => {
    expect(buildSearchWindows(80, 30).slice(1)).toEqual([
      { minBatteryPercent: 30, maxBatteryPercent: 40, preferred: false },
      { minBatteryPercent: 40, maxBatteryPercent: 50, preferred: false },
      { minBatteryPercent: 50, maxBatteryPercent: 60, preferred: false },
      { minBatteryPercent: 60, maxBatteryPercent: 70, preferred: false },
      { minBatteryPercent: 70, maxBatteryPercent: 80, preferred: false }
    ]);
  });

  it("stops at the current battery limit", () => {
    expect(buildSearchWindows(45, 30).at(-1)).toEqual({
      minBatteryPercent: 30,
      maxBatteryPercent: 40,
      preferred: false
    });
  });
});
