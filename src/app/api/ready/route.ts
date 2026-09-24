import { neon } from "@neondatabase/serverless";
import { env } from "@/config/env";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return executeRoute(request, async (requestId) => {
    try {
      await neon(env.DATABASE_URL)`select 1 as ready`;
      return successResponse({ status: "ready", checks: { database: "ok" } }, requestId);
    } catch {
      return errorResponse("NOT_READY", "Service dependencies are unavailable.", 503, requestId);
    }
  });
}
