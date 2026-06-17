import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  STORAGE_MODE: z.enum(["json", "postgres"]).default("json"),
  DATABASE_URL: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  ROUTING_BASE_URL: z.string().url().default("http://router.project-osrm.org"),
  ROUTING_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  VIETMAP_SERVICE_API_KEY: z.string().min(1).optional(),
  VIETMAP_ROUTING_BASE_URL: z.string().url().default("https://maps.vietmap.vn"),
  STATION_SEARCH_RADIUS_KM: z.coerce.number().positive().default(5),
  ROUTE_CORRIDOR_RADIUS_KM: z.coerce.number().positive().default(8),
  STATION_INGEST_CRON: z.string().default("0 */6 * * *"),
  STATION_DATA_PATH: z.string().default("../data/ev-stations.raw.json"),
  VEHICLE_DATA_PATH: z.string().default("../data/ev-cars.raw.json")
}).superRefine((env, ctx) => {
  if (env.STORAGE_MODE === "postgres" && !env.DATABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "DATABASE_URL is required when STORAGE_MODE=postgres",
      path: ["DATABASE_URL"]
    });
  }
});

export const env = EnvSchema.parse(process.env);

export type Env = typeof env;
