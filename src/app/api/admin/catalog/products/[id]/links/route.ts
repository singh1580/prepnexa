import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { linkProduct } from "@/features/admin-catalog/service";
import { catalogIdSchema, productLinkSchema } from "@/features/admin-catalog/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageProducts); const input = productLinkSchema.parse(await request.json()); const result = await linkProduct(catalogIdSchema.parse((await params).id), input.kind, input.id, { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
