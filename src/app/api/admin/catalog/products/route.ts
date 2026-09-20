import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createProduct } from "@/features/admin-catalog/service";
import { productCreateSchema } from "@/features/admin-catalog/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageProducts); const result = await createProduct(productCreateSchema.parse(await request.json()), { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
