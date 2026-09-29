import { requirePermission } from "@/features/auth/authorization";
import { deleteMaterial, updateMaterial } from "@/features/admin-catalog/service";
import { catalogIdSchema, materialInputSchema } from "@/features/admin-catalog/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("material.manage");
    return successResponse(await updateMaterial(catalogIdSchema.parse((await params).id), materialInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId);
  });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("material.manage");
    return successResponse(await deleteMaterial(catalogIdSchema.parse((await params).id), { userId: auth.user.id, requestId }), requestId);
  });
}
