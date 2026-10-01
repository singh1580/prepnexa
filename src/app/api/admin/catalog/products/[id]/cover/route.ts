import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { uploadProductCover } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { AppError } from "@/lib/errors/app-error";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.manageProducts);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("PRODUCT_COVER_REQUIRED", "Choose a package cover image.", 400);
    const result = await uploadProductCover(catalogIdSchema.parse((await params).id), file, { userId: auth.user.id, requestId });
    return successResponse(result, requestId);
  });
}
