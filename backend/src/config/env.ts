import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  ROUTING_BASE_URL: z.string().url().default("http://router.project-osrm.org"),
  ROUTING_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  STATION_SEARCH_RADIUS_KM: z.coerce.number().positive().default(5),
  ROUTE_CORRIDOR_RADIUS_KM: z.coerce.number().positive().default(3),
  STATION_INGEST_CRON: z.string().default("0 */6 * * *"),
  STATION_DATA_PATH: z.string().default("../data/ev-stations.raw.json")
});

export const env = EnvSchema.parse(process.env);

export type Env = typeof env;
