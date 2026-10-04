import type { Instrumentation } from "next";
import { logger } from "@/lib/logger";

export function register() {}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const details = error instanceof Error
    ? { errorType: error.name, digest: "digest" in error ? error.digest : undefined }
    : { errorType: "UnknownError" };
  logger.error(
    {
      ...details,
      module: "next",
      action: "request_error",
      method: request.method,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    "Unhandled Next.js request error",
  );
};
