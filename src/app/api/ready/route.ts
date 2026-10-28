import { neon } from "@neondatabase/serverless";
import { env } from "@/config/env";
import { errorResponse, successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
import { privateStorage } from "@/features/materials/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return executeRoute(request, async (requestId) => {
    try {
      privateStorage();
      await neon(env.DATABASE_URL)`select 1 as ready`;
      return successResponse({ status: "ready", checks: { database: "ok", configuration: "ok", privateStorage: "configured", paymentProvider: env.PAYMENT_PROVIDER, email: env.RESEND_API_KEY ? "configured" : "disabled" } }, requestId);
    } catch {
      return errorResponse("NOT_READY", "Service dependencies are unavailable.", 503, requestId);
    }
  });
}
