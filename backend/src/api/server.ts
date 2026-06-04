import { env } from "../config/env.js";
import { closeDb, pool } from "../db/client.js";
import { StationRepository } from "../db/repositories/stationRepository.js";
import { VehicleRepository } from "../db/repositories/vehicleRepository.js";
import { RoutePlannerService } from "../domain/routePlanner.js";
import { OsrmClient } from "../providers/osrmClient.js";
import { logger } from "../utils/logger.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const vehicleRepository = new VehicleRepository(pool);
  const stationRepository = new StationRepository(pool);
  const routingProvider = new OsrmClient(env.ROUTING_BASE_URL, env.ROUTING_TIMEOUT_MS);
  const routePlanner = new RoutePlannerService(
    vehicleRepository,
    stationRepository,
    routingProvider,
    env.ROUTE_CORRIDOR_RADIUS_KM
  );

  const app = await buildApp({
    checkDatabase: async () => {
      await pool.query("SELECT 1");
    },
    vehicleRepository,
    stationRepository,
    routePlanner,
    defaultStationSearchRadiusKm: env.STATION_SEARCH_RADIUS_KM
  });

  const shutdown = async (signal: string) => {
    logger.info("API shutting down", { signal });
    await app.close();
    await closeDb();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ host: env.HOST, port: env.PORT });
}

main().catch((error) => {
  logger.error("API startup failed", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
