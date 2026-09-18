import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request: Request) {
  return executeRoute(request, async (requestId) =>
    successResponse({ status: "ok", service: "prepnexa-web", timestamp: new Date().toISOString() }, requestId),
  );
}
