import { requirePermission } from "@/features/auth/authorization";
import { removeTestItem, updateSection } from "@/features/admin-tests/service";
import { testIdSchema, sectionInputSchema } from "@/features/admin-tests/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; questionId?: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("test.manage");
    const values = await params;
    return successResponse(await removeTestItem(testIdSchema.parse(values.id), null, { userId: auth.user.id, requestId }), requestId);
  });
}


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("test.manage");
    return successResponse(await updateSection(testIdSchema.parse((await params).id), sectionInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId);
  });
}
