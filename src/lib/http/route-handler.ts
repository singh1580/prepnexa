import { ZodError } from "zod";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import { errorResponse } from "./api-response";

type Handler = (requestId: string) => Promise<Response>;

export async function executeRoute(request: Request, handler: Handler) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  try {
    return await handler(requestId);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn({ requestId, module: "http", action: "validation_failed", issues: error.issues }, "Request validation failed");
      return errorResponse("VALIDATION_ERROR", "The request contains invalid data.", 400, requestId, error.flatten());
    }
    if (error instanceof AppError) {
      logger.warn({ requestId, module: "http", action: "application_error", code: error.code, status: error.status }, error.message);
      return errorResponse(error.code, error.message, error.status, requestId, error.details);
    }
    logger.error({ requestId, module: "http", action: "unhandled_error", error }, "Unhandled route error");
    return errorResponse("INTERNAL_ERROR", "Something went wrong.", 500, requestId);
  }
}
