import { describe, expect, it } from "vitest";
import {
  distanceReachableKm,
  estimateArrivalBatteryPercent,
  estimateBatteryUsedPercent
} from "../src/domain/battery.js";

describe("battery helpers", () => {
  it("estimates battery usage from distance and official range", () => {
    expect(estimateBatteryUsedPercent(50, 500)).toBe(10);
  });

  it("estimates arrival battery and clamps the value", () => {
    expect(estimateArrivalBatteryPercent(80, 100, 500)).toBe(60);
    expect(estimateArrivalBatteryPercent(10, 200, 500)).toBe(0);
  });

  it("calculates reachable distance above a target battery", () => {
    expect(distanceReachableKm(80, 20, 500)).toBe(300);
  });
});
