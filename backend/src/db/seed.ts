import { pool, closeDb } from "./client.js";
import { VehicleRepository } from "./repositories/vehicleRepository.js";
import { StationRepository } from "./repositories/stationRepository.js";
import { vehicleSeeds } from "./seeds/vehicles.js";
import { ingestStations } from "../worker/stationIngestion.js";
import { LocalStationJsonSource } from "../worker/sources/localStationJsonSource.js";
import { GoogleMyMapsStationNormalizer } from "../worker/normalizers/googleMyMapsStationNormalizer.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

async function seed(): Promise<void> {
  const vehicleRepository = new VehicleRepository(pool);
  const stationRepository = new StationRepository(pool);
  const vehicleCount = await vehicleRepository.upsertVehicles(vehicleSeeds);
  const stationSummary = await ingestStations({
    source: new LocalStationJsonSource(env.STATION_DATA_PATH),
    normalizer: new GoogleMyMapsStationNormalizer(),
    repository: stationRepository
  });
  logger.info("Seed complete", { vehicleCount, stationSummary });
}

seed()
  .catch((error) => {
    logger.error("Seed failed", { error: error instanceof Error ? error.message : String(error) });
    process.exitCode = 1;
  })
  .finally(() => closeDb());
