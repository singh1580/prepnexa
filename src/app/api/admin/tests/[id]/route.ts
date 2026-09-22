import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { updateTest } from "@/features/admin-tests/service";
import { testIdSchema, testInputSchema } from "@/features/admin-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageTests); const result = await updateTest(testIdSchema.parse((await params).id), testInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }); return successResponse(result, requestId); }); }
