import { z } from "zod";
import { CoordinateSchema, LineStringSchema, PercentageSchema } from "./common.js";

export const PlanRouteRequestSchema = z.object({
  start: CoordinateSchema,
  destination: CoordinateSchema,
  vehicleModelId: z.string().min(1),
  currentBatteryPercent: PercentageSchema.refine((value) => value > 0, "Current battery must be greater than 0"),
  chargeThresholdPercent: PercentageSchema.default(30),
  routingProvider: z.enum(["osrm", "vietmap"]).default("osrm")
});

export const PlanRouteResponseSchema = z.object({
  routeGeometry: LineStringSchema,
  chargingStops: z.array(
    z.object({
      stationId: z.string(),
      name: z.string(),
      address: z.string().nullable().optional(),
      status: z.string().nullable().optional(),
      accessInfo: z.string().nullable().optional(),
      connectorSummary: z.string().nullable().optional(),
      connectorCount: z.number().nullable().optional(),
      maxPowerKw: z.number().nullable().optional(),
      powerLevelsKw: z.array(z.number()).optional(),
      lat: z.number(),
      lng: z.number(),
      batteryBeforeChargingPercent: z.number(),
      batteryAfterChargingPercent: z.number(),
      selectionReason: z.string().optional()
    })
  ),
  legs: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      distanceKm: z.number(),
      estimatedArrivalBatteryPercent: z.number()
    })
  ),
  summary: z.object({
    totalDistanceKm: z.number(),
    totalDurationSeconds: z.number(),
    chargingStopCount: z.number()
  }),
  warnings: z.array(z.string())
});

export type PlanRouteRequest = z.infer<typeof PlanRouteRequestSchema>;
