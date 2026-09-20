import { questionInputSchema } from "@/features/admin-content/validation";
import { addTestQuestions } from "@/features/admin-tests/question-import";
import { requirePermission, requirePermissions } from "@/features/auth/authorization";
import { removeTestItem } from "@/features/admin-tests/service";
import { testIdSchema } from "@/features/admin-tests/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; questionId?: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("test.manage");
    const values = await params;
    return successResponse(await removeTestItem(testIdSchema.parse(values.id), testIdSchema.parse(values.questionId), { userId: auth.user.id, requestId }), requestId);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requirePermissions(["test.manage", "question.create"]);
    const values = await params;
    const input = questionInputSchema.parse(await request.json());
    const result = await addTestQuestions(testIdSchema.parse(values.id), [input], { userId: auth.user.id, requestId }, testIdSchema.parse(values.questionId));
    return successResponse(result, requestId);
  });
}
