import fs from "node:fs/promises";
import path from "node:path";
import type { Vehicle } from "../domain/types.js";

type RawVehicleData = {
  models?: Array<{
    id?: unknown;
    brand?: unknown;
    model?: unknown;
    variant?: unknown;
    officialRange?: {
      kmEquivalent?: unknown;
    } | null;
  }>;
};

export class JsonVehicleRepository {
  private vehiclesPromise: Promise<Vehicle[]> | null = null;

  constructor(private readonly dataPath: string) {}

  async listVehicles(): Promise<Vehicle[]> {
    const vehicles = await this.loadVehicles();
    return [...vehicles].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findVehicleById(id: string): Promise<Vehicle | null> {
    const vehicles = await this.loadVehicles();
    return vehicles.find((vehicle) => vehicle.id === id) ?? null;
  }

  private loadVehicles(): Promise<Vehicle[]> {
    this.vehiclesPromise ??= this.readVehicles();
    return this.vehiclesPromise;
  }

  private async readVehicles(): Promise<Vehicle[]> {
    const body = await fs.readFile(path.resolve(process.cwd(), this.dataPath), "utf8");
    const parsed = JSON.parse(body) as RawVehicleData;

    return (parsed.models ?? [])
      .map((model) => {
        const range = model.officialRange?.kmEquivalent;
        const name = [model.brand, model.model, model.variant]
          .filter((part): part is string => typeof part === "string" && part.length > 0)
          .join(" ");

        if (typeof model.id !== "string" || !name || typeof range !== "number") {
          return null;
        }

        return {
          id: model.id,
          name,
          officialRangeKm: range
        };
      })
      .filter((vehicle): vehicle is Vehicle => vehicle !== null);
  }
}
