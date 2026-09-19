import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { publishProduct } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageProducts); const result = await publishProduct(catalogIdSchema.parse((await params).id), { userId: auth.user.id, requestId }); return successResponse(result, requestId); }); }
