import fs from "node:fs/promises";
import path from "node:path";
import type { ChargingStation, Coordinate } from "../domain/types.js";
import { haversineDistanceKm } from "../utils/geo.js";

type RawStationData = {
  stations?: Array<{
    source_index?: unknown;
    name?: unknown;
    description_text?: unknown;
    layer?: unknown;
    coordinates?: {
      lat?: unknown;
      lng?: unknown;
    };
  }>;
};

export class JsonStationRepository {
  private stationsPromise: Promise<ChargingStation[]> | null = null;

  constructor(private readonly dataPath: string) {}

  async findStationsNearPoint({
    lat,
    lng,
    radiusKm,
    limit
  }: Coordinate & { radiusKm: number; limit: number }): Promise<ChargingStation[]> {
    const origin = { lat, lng };
    const stations = await this.loadStations();
    return stations
      .map((station) => ({
        ...station,
        distanceKm: haversineDistanceKm(origin, station)
      }))
      .filter((station) => station.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, limit);
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

    const excluded = new Set(excludeStationIds);
    const stations = await this.loadStations();
    return stations
      .filter((station) => !excluded.has(station.id))
      .map((station) => {
        let distanceKm = Number.POSITIVE_INFINITY;
        for (const point of points) {
          distanceKm = Math.min(distanceKm, haversineDistanceKm(point, station));
        }
        return { ...station, distanceKm };
      })
      .filter((station) => station.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, limit);
  }

  private loadStations(): Promise<ChargingStation[]> {
    this.stationsPromise ??= this.readStations();
    return this.stationsPromise;
  }

  private async readStations(): Promise<ChargingStation[]> {
    const body = await fs.readFile(path.resolve(process.cwd(), this.dataPath), "utf8");
    const parsed = JSON.parse(body) as RawStationData;

    return (parsed.stations ?? [])
      .flatMap((station) => {
        const lat = station.coordinates?.lat;
        const lng = station.coordinates?.lng;
        if (
          typeof station.source_index !== "number" ||
          typeof station.name !== "string" ||
          typeof lat !== "number" ||
          typeof lng !== "number"
        ) {
          return [];
        }

        const descriptionText = typeof station.description_text === "string" ? station.description_text : "";
        const details = parseStationDetails(descriptionText);

        const normalized: ChargingStation = {
          id: String(station.source_index),
          provider: "vinfast",
          providerStationId: String(station.source_index),
          name: station.name,
          address: details.address,
          accessInfo: details.accessInfo,
          connectorSummary: details.connectorSummary,
          connectorCount: details.connectorCount,
          maxPowerKw: details.maxPowerKw,
          powerLevelsKw: details.powerLevelsKw,
          lat,
          lng,
          status: details.status ?? (typeof station.layer === "string" ? station.layer : null)
        };

        return [normalized];
      })
  }
}

function parseStationDetails(descriptionText: string): {
  address: string | null;
  accessInfo: string | null;
  connectorSummary: string | null;
  connectorCount: number | null;
  maxPowerKw: number | null;
  powerLevelsKw: number[];
  status: string | null;
} {
  const lines = descriptionText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const address = stripLabel(lines.find((line) => line.startsWith("Địa chỉ::")));
  const accessInfo = stripLabel(lines.find((line) => line.startsWith("Hoạt động::")));
  const status = stripLabel(lines.find((line) => line.startsWith("Trạng thái::")));
  const connectorLines = lines.filter((line) => /kW/i.test(line) && /cổng sạc/i.test(line));
  const connectors = connectorLines
    .map((line) => {
      const match = line.match(/(\d+(?:[.,]\d+)?)\s*kW.*?(\d+)\s*cổng sạc/i);
      if (!match) return null;
      return {
        powerKw: Number(match[1].replace(",", ".")),
        count: Number(match[2])
      };
    })
    .filter((connector): connector is { powerKw: number; count: number } => connector !== null);
  const connectorCount = connectors.reduce((sum, connector) => sum + connector.count, 0);
  const powerLevelsKw = [...new Set(connectors.map((connector) => connector.powerKw))].sort((a, b) => b - a);
  const connectorSummary =
    connectors.length > 0
      ? connectors.map((connector) => `${connector.count} x ${connector.powerKw}kW`).join(", ")
      : null;

  return {
    address,
    accessInfo,
    connectorSummary,
    connectorCount: connectorCount || null,
    maxPowerKw: powerLevelsKw[0] ?? null,
    powerLevelsKw,
    status
  };
}

function stripLabel(line?: string): string | null {
  if (!line) return null;
  const value = line.replace(/^.+?::\s*/, "").trim();
  return value || null;
}
