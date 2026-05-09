import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { registerErrorHandler } from "./errors.js";
import { registerHealthRoutes, type HealthDependencies } from "./routes/health.js";
import { registerRoutePlanRoutes } from "./routes/routePlan.js";
import { registerStationRoutes } from "./routes/stations.js";
import { registerVehicleRoutes } from "./routes/vehicles.js";
import type { StationRepository } from "../db/repositories/stationRepository.js";
import type { VehicleRepository } from "../db/repositories/vehicleRepository.js";
import type { RoutePlannerService } from "../domain/routePlanner.js";

export type AppDependencies = HealthDependencies & {
  vehicleRepository: Pick<VehicleRepository, "listVehicles">;
  stationRepository: Pick<StationRepository, "findStationsNearPoint">;
  routePlanner: Pick<RoutePlannerService, "planRoute">;
  defaultStationSearchRadiusKm: number;
};

export async function buildApp(deps: AppDependencies) {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(sensible);
  registerErrorHandler(app);
  await registerHealthRoutes(app, deps);
  await registerVehicleRoutes(app, deps);
  await registerStationRoutes(app, {
    stationRepository: deps.stationRepository,
    defaultRadiusKm: deps.defaultStationSearchRadiusKm
  });
  await registerRoutePlanRoutes(app, deps);
  return app;
}
