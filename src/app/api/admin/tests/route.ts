import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createTest } from "@/features/admin-tests/service";
import { testInputSchema } from "@/features/admin-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageTests); const result = await createTest(testInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
