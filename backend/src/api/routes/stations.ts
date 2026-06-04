import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { StationRepository } from "../../db/repositories/stationRepository.js";

export async function registerStationRoutes(
  app: FastifyInstance,
  deps: { stationRepository: Pick<StationRepository, "findStationsNearPoint">; defaultRadiusKm: number }
): Promise<void> {
  app.get("/api/stations", async (request) => {
    const StationQuerySchema = z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      radiusKm: z.coerce.number().positive().max(100).default(deps.defaultRadiusKm)
    });
    const query = StationQuerySchema.parse(request.query);
    return deps.stationRepository.findStationsNearPoint({
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm,
      limit: 100
    });
  });
}
