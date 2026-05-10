import { env } from "../config/env.js";
import { JsonStationRepository } from "../demo/jsonStationRepository.js";
import { JsonVehicleRepository } from "../demo/jsonVehicleRepository.js";
import { RoutePlannerService } from "../domain/routePlanner.js";
import { OsrmClient } from "../providers/osrmClient.js";
import { logger } from "../utils/logger.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const storage = await buildStorage();
  const routingProvider = new OsrmClient(env.ROUTING_BASE_URL, env.ROUTING_TIMEOUT_MS);
  const routePlanner = new RoutePlannerService(
    storage.vehicleRepository,
    storage.stationRepository,
    routingProvider,
    env.ROUTE_CORRIDOR_RADIUS_KM
  );

  const app = await buildApp({
    checkDatabase: storage.checkDatabase,
    vehicleRepository: storage.vehicleRepository,
    stationRepository: storage.stationRepository,
    routePlanner,
    defaultStationSearchRadiusKm: env.STATION_SEARCH_RADIUS_KM
  });

  const shutdown = async (signal: string) => {
    logger.info("API shutting down", { signal });
    await app.close();
    await storage.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ host: env.HOST, port: env.PORT });
}

async function buildStorage() {
  if (env.STORAGE_MODE === "postgres") {
    const [{ closeDb, pool }, { StationRepository }, { VehicleRepository }] = await Promise.all([
      import("../db/client.js"),
      import("../db/repositories/stationRepository.js"),
      import("../db/repositories/vehicleRepository.js")
    ]);
    const vehicleRepository = new VehicleRepository(pool);
    const stationRepository = new StationRepository(pool);
    return {
      vehicleRepository,
      stationRepository,
      checkDatabase: async () => {
        await pool.query("SELECT 1");
      },
      close: closeDb
    };
  }

  const vehicleRepository = new JsonVehicleRepository(env.VEHICLE_DATA_PATH);
  const stationRepository = new JsonStationRepository(env.STATION_DATA_PATH);
  return {
    vehicleRepository,
    stationRepository,
    checkDatabase: async () => {
      await Promise.all([vehicleRepository.listVehicles(), stationRepository.findStationsNearPoint({
        lat: 10.7769,
        lng: 106.7009,
        radiusKm: 1,
        limit: 1
      })]);
    },
    close: async () => {}
  };
}

main().catch((error) => {
  logger.error("API startup failed", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
