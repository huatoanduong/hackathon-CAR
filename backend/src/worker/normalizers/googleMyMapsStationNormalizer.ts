import type { StationUpsertInput } from "../../db/repositories/stationRepository.js";
import type { RawStationRecord } from "../sources/localStationJsonSource.js";

export type NormalizedStationResult = {
  stations: StationUpsertInput[];
  skipped: number;
};

export class GoogleMyMapsStationNormalizer {
  normalize(records: RawStationRecord[]): NormalizedStationResult {
    const stations: StationUpsertInput[] = [];
    let skipped = 0;

    for (const record of records) {
      const station = this.normalizeOne(record);
      if (station) stations.push(station);
      else skipped += 1;
    }

    return { stations, skipped };
  }

  normalizeOne(record: RawStationRecord): StationUpsertInput | null {
    const sourceIndex = valueToString(record.source_index);
    const name = valueToString(record.name);
    const coordinates = record.coordinates as { lat?: unknown; lng?: unknown } | undefined;
    const lat = Number(coordinates?.lat);
    const lng = Number(coordinates?.lng);
    if (!sourceIndex || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const extendedData = record.extendedData as Record<string, unknown> | undefined;
    const note = valueToString(extendedData?.["Ghi chú:"]);

    return {
      provider: "google_my_maps",
      providerStationId: sourceIndex,
      name,
      address: valueToString(extendedData?.["Địa chỉ:"]) || null,
      lat,
      lng,
      status: valueToString(extendedData?.["Trạng thái:"]) || valueToString(record.layer) || null,
      sourceUpdatedAt: parseVietnameseUpdatedDate(note),
      rawPayload: record
    };
  }
}

function valueToString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function parseVietnameseUpdatedDate(note: string): Date | null {
  const match = note.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
