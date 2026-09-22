import { requirePermissions } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { publishTest } from "@/features/admin-tests/service";
import { testIdSchema } from "@/features/admin-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async (requestId) => { const auth = await requirePermissions([CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.publishQuestions]); const result = await publishTest(testIdSchema.parse((await params).id), { userId: auth.user.id, requestId }); return successResponse(result, requestId); }); }
