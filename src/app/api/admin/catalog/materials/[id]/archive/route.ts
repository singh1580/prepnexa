import { requirePermission } from "@/features/auth/authorization";
import { archiveCatalog } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("material.manage");
    return successResponse(await archiveCatalog(catalogIdSchema.parse((await params).id), "material", { userId: auth.user.id, requestId }), requestId);
  });
}
