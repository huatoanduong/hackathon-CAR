import { readFile } from "node:fs/promises";
import path from "node:path";

export type RawStationRecord = Record<string, unknown>;

export class LocalStationJsonSource {
  constructor(private readonly filePath: string) {}

  async read(): Promise<RawStationRecord[]> {
    const resolved = path.isAbsolute(this.filePath)
      ? this.filePath
      : path.resolve(process.cwd(), this.filePath);
    const body = await readFile(resolved, "utf8");
    const parsed = JSON.parse(body) as { stations?: unknown };
    if (!Array.isArray(parsed.stations)) {
      throw new Error("Station JSON must contain a stations array");
    }
    return parsed.stations as RawStationRecord[];
  }
}
