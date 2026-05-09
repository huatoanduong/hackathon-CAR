import type { FastifyInstance } from "fastify";
import type { RoutePlannerService } from "../../domain/routePlanner.js";
import { PlanRouteRequestSchema } from "../schemas/routePlan.js";

export async function registerRoutePlanRoutes(
  app: FastifyInstance,
  deps: { routePlanner: Pick<RoutePlannerService, "planRoute"> }
): Promise<void> {
  app.post("/api/routes/plan", async (request) => {
    const body = PlanRouteRequestSchema.parse(request.body);
    return deps.routePlanner.planRoute(body);
  });
}
