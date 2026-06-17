import type pg from "pg";
import type { Vehicle } from "../../domain/types.js";

export class VehicleRepository {
  constructor(private readonly pool: pg.Pool) {}

  async listVehicles(): Promise<Vehicle[]> {
    const result = await this.pool.query(
      "SELECT id, name, official_range_km FROM vehicles ORDER BY name ASC"
    );
    return result.rows.map(mapVehicle);
  }

  async findVehicleById(id: string): Promise<Vehicle | null> {
    const result = await this.pool.query(
      "SELECT id, name, official_range_km FROM vehicles WHERE id = $1",
      [id]
    );
    return result.rows[0] ? mapVehicle(result.rows[0]) : null;
  }

  async upsertVehicles(vehicles: Vehicle[]): Promise<number> {
    for (const vehicle of vehicles) {
      await this.pool.query(
        `
          INSERT INTO vehicles (id, name, official_range_km, updated_at)
          VALUES ($1, $2, $3, now())
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              official_range_km = EXCLUDED.official_range_km,
              updated_at = now()
        `,
        [vehicle.id, vehicle.name, vehicle.officialRangeKm]
      );
    }
    return vehicles.length;
  }
}

function mapVehicle(row: { id: string; name: string; official_range_km: number }): Vehicle {
  return {
    id: row.id,
    name: row.name,
    officialRangeKm: Number(row.official_range_km)
  };
}
