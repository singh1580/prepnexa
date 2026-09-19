import { requirePermission } from "@/features/auth/authorization";
import { removeTestItem } from "@/features/admin-tests/service";
import { testIdSchema } from "@/features/admin-tests/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; questionId?: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("test.manage");
    const values = await params;
    return successResponse(await removeTestItem(testIdSchema.parse(values.id), testIdSchema.parse(values.questionId), { userId: auth.user.id, requestId }), requestId);
  });
}
