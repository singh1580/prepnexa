import { requirePermission } from "@/features/auth/authorization";
import { duplicateProduct } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("product.manage");
    return successResponse(await duplicateProduct(catalogIdSchema.parse((await params).id), { userId: auth.user.id, requestId }), requestId);
  });
}
