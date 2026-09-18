import { requireAdmin } from "@/features/auth/authorization";
import { setupMfa } from "@/features/auth/mfa";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const auth = await requireAdmin();
    return successResponse(await setupMfa(auth.user), requestId);
  });
}
