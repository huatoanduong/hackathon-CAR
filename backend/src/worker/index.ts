import cron from "node-cron";
import { env } from "../config/env.js";
import { pool, closeDb } from "../db/client.js";
import { StationRepository } from "../db/repositories/stationRepository.js";
import { logger } from "../utils/logger.js";
import { GoogleMyMapsStationNormalizer } from "./normalizers/googleMyMapsStationNormalizer.js";
import { ingestStations } from "./stationIngestion.js";
import { LocalStationJsonSource } from "./sources/localStationJsonSource.js";

const source = new LocalStationJsonSource(env.STATION_DATA_PATH);
const normalizer = new GoogleMyMapsStationNormalizer();
const repository = new StationRepository(pool);

async function runIngestion(): Promise<void> {
  const summary = await ingestStations({ source, normalizer, repository });
  logger.info("Station ingestion complete", summary);
}

runIngestion().catch((error) => {
  logger.error("Initial station ingestion failed", {
    error: error instanceof Error ? error.message : String(error)
  });
});

const task = cron.schedule(env.STATION_INGEST_CRON, () => {
  runIngestion().catch((error) => {
    logger.error("Scheduled station ingestion failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info("Worker shutting down", { signal });
  task.stop();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
