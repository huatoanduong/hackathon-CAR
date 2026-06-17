import type pg from "pg";
import type { ChargingStation, Coordinate } from "../../domain/types.js";
import { kmToMeters } from "../../utils/geo.js";

export type StationUpsertInput = Omit<ChargingStation, "id" | "distanceKm" | "routeProgressKm"> & {
  sourceUpdatedAt: Date | null;
  rawPayload: unknown;
};

export type StationUpsertResult = {
  inserted: number;
  updated: number;
};

export class StationRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findStationsNearPoint({
    lat,
    lng,
    radiusKm,
    limit
  }: Coordinate & { radiusKm: number; limit: number }): Promise<ChargingStation[]> {
    const result = await this.pool.query(
      `
        SELECT id, provider, provider_station_id, name, address, latitude, longitude, status,
          ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
        FROM charging_stations
        WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
        ORDER BY distance_km ASC
        LIMIT $4
      `,
      [lat, lng, kmToMeters(radiusKm), limit]
    );
    return result.rows.map(mapStation);
  }

  async findStationsNearRoutePoints({
    points,
    radiusKm,
    excludeStationIds,
    limit
  }: {
    points: Coordinate[];
    radiusKm: number;
    excludeStationIds: string[];
    limit: number;
  }): Promise<ChargingStation[]> {
    if (points.length === 0) return [];
    const values = points.map((point, index) => `($${index * 2 + 1}::double precision, $${index * 2 + 2}::double precision)`);
    const pointParams = points.flatMap((point) => [point.lat, point.lng]);
    const radiusParam = pointParams.length + 1;
    const excludedParam = pointParams.length + 2;
    const limitParam = pointParams.length + 3;

    const result = await this.pool.query(
      `
        WITH route_points(lat, lng) AS (VALUES ${values.join(", ")}),
        candidates AS (
          SELECT DISTINCT ON (cs.id)
            cs.id, cs.provider, cs.provider_station_id, cs.name, cs.address,
            cs.latitude, cs.longitude, cs.status,
            ST_Distance(cs.location, ST_SetSRID(ST_MakePoint(rp.lng, rp.lat), 4326)::geography) / 1000 AS distance_km
          FROM charging_stations cs
          JOIN route_points rp
            ON ST_DWithin(cs.location, ST_SetSRID(ST_MakePoint(rp.lng, rp.lat), 4326)::geography, $${radiusParam})
          WHERE NOT (cs.id::text = ANY($${excludedParam}::text[]))
          ORDER BY cs.id, distance_km ASC
        )
        SELECT * FROM candidates
        ORDER BY distance_km ASC
        LIMIT $${limitParam}
      `,
      [...pointParams, kmToMeters(radiusKm), excludeStationIds, limit]
    );
    return result.rows.map(mapStation);
  }

  async upsertStations(stations: StationUpsertInput[]): Promise<StationUpsertResult> {
    let inserted = 0;
    let updated = 0;
    for (const station of stations) {
      const result = await this.pool.query(
        `
          INSERT INTO charging_stations (
            provider, provider_station_id, name, address, latitude, longitude, location,
            status, raw_payload, source_updated_at, last_seen_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography,
            $7, $8::jsonb, $9, now(), now()
          )
          ON CONFLICT (provider, provider_station_id) DO UPDATE
          SET name = EXCLUDED.name,
              address = EXCLUDED.address,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              location = EXCLUDED.location,
              status = EXCLUDED.status,
              raw_payload = EXCLUDED.raw_payload,
              source_updated_at = EXCLUDED.source_updated_at,
              last_seen_at = now(),
              updated_at = now()
          RETURNING (xmax = 0) AS inserted
        `,
        [
          station.provider,
          station.providerStationId,
          station.name,
          station.address,
          station.lat,
          station.lng,
          station.status,
          JSON.stringify(station.rawPayload),
          station.sourceUpdatedAt
        ]
      );
      if (result.rows[0]?.inserted) inserted += 1;
      else updated += 1;
    }
    return { inserted, updated };
  }
}

function mapStation(row: {
  id: number | string;
  provider: string;
  provider_station_id: string;
  name: string;
  address: string | null;
  latitude: number | string;
  longitude: number | string;
  status: string | null;
  distance_km?: number | string;
}): ChargingStation {
  return {
    id: String(row.id),
    provider: row.provider,
    providerStationId: row.provider_station_id,
    name: row.name,
    address: row.address,
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    status: row.status,
    distanceKm: row.distance_km == null ? undefined : Number(row.distance_km)
  };
}
