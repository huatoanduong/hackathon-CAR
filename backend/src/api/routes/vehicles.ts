import type { FastifyInstance } from "fastify";
import type { VehicleRepository } from "../../db/repositories/vehicleRepository.js";

export async function registerVehicleRoutes(
  app: FastifyInstance,
  deps: { vehicleRepository: Pick<VehicleRepository, "listVehicles"> }
): Promise<void> {
  app.get("/api/vehicles", async () => deps.vehicleRepository.listVehicles());
}
