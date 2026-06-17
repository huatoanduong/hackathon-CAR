import type { StationRepository } from "../db/repositories/stationRepository.js";
import type { GoogleMyMapsStationNormalizer } from "./normalizers/googleMyMapsStationNormalizer.js";
import type { LocalStationJsonSource } from "./sources/localStationJsonSource.js";

export type StationIngestionSummary = {
  read: number;
  normalized: number;
  skipped: number;
  inserted: number;
  updated: number;
};

export async function ingestStations({
  source,
  normalizer,
  repository
}: {
  source: LocalStationJsonSource;
  normalizer: GoogleMyMapsStationNormalizer;
  repository: StationRepository;
}): Promise<StationIngestionSummary> {
  const records = await source.read();
  const normalized = normalizer.normalize(records);
  const upserted = await repository.upsertStations(normalized.stations);
  return {
    read: records.length,
    normalized: normalized.stations.length,
    skipped: normalized.skipped,
    inserted: upserted.inserted,
    updated: upserted.updated
  };
}
