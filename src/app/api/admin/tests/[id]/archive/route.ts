import { requirePermission } from "@/features/auth/authorization";
import { archiveTest } from "@/features/admin-tests/service";
import { testIdSchema } from "@/features/admin-tests/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("test.manage");
    return successResponse(await archiveTest(testIdSchema.parse((await params).id), { userId: auth.user.id, requestId }), requestId);
  });
}
