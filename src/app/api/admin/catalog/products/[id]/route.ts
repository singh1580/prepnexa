import { requirePermission } from "@/features/auth/authorization";
import { updateProduct } from "@/features/admin-catalog/service";
import { catalogIdSchema, productInputSchema } from "@/features/admin-catalog/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("product.manage");
    return successResponse(await updateProduct(catalogIdSchema.parse((await params).id), productInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId);
  });
}
