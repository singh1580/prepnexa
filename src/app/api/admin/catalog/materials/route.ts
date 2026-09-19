import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createMaterial } from "@/features/admin-catalog/service";
import { materialInputSchema } from "@/features/admin-catalog/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageMaterials); const result = await createMaterial(materialInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
