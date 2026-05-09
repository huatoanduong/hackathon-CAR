import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NOT_FOUND", message, 404);
  }
}

export class RoutePlanningError extends AppError {
  constructor(message: string) {
    super("ROUTE_PLANNING_ERROR", message, 422);
  }
}

export class RoutingProviderError extends AppError {
  constructor(message: string) {
    super("ROUTING_PROVIDER_ERROR", message, 502);
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, _request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join("; ");
      void reply.status(400).send(errorBody("VALIDATION_ERROR", message));
      return;
    }
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send(errorBody(error.code, error.message));
      return;
    }
    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    const code = statusCode === 400 ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR";
    void reply.status(statusCode).send(errorBody(code, error.message || "Unexpected server error"));
  });
}

function errorBody(code: string, message: string): { error: { code: string; message: string }; message: string } {
  return {
    error: { code, message },
    message
  };
}
