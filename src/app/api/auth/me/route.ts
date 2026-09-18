import { requireAuthenticated } from "@/features/auth/authorization";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request: Request) {
  return executeRoute(request, async (requestId) => successResponse(await requireAuthenticated(), requestId));
}
