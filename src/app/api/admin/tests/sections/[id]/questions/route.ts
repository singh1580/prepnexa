import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { assignQuestion } from "@/features/admin-tests/service";
import { assignmentInputSchema, testIdSchema } from "@/features/admin-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageTests); const input = assignmentInputSchema.parse(await request.json()); const result = await assignQuestion(testIdSchema.parse((await params).id), input.questionId, input.sortOrder, { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
