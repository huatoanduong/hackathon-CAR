import type { FastifyInstance } from "fastify";

export type HealthDependencies = {
  checkDatabase: () => Promise<void>;
};

export async function registerHealthRoutes(app: FastifyInstance, deps: HealthDependencies): Promise<void> {
  app.get("/health", async (_request, reply) => {
    try {
      await deps.checkDatabase();
      return { status: "ok", database: "ok" };
    } catch {
      return reply.status(503).send({
        error: { code: "DATABASE_UNAVAILABLE", message: "Database connectivity check failed" },
        message: "Database connectivity check failed"
      });
    }
  });
}
