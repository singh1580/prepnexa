import { requirePermission } from "@/features/auth/authorization";
import { reorderQuestions } from "@/features/admin-tests/service";
import { testIdSchema, questionOrderSchema } from "@/features/admin-tests/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("test.manage");
    return successResponse(await reorderQuestions(testIdSchema.parse((await params).id), questionOrderSchema.parse(await request.json()).questionIds, { userId: auth.user.id, requestId }), requestId);
  });
}
