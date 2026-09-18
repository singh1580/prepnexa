import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createQuestion } from "@/features/admin-content/service";
import { questionInputSchema } from "@/features/admin-content/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.createQuestions);
    const question = await createQuestion(questionInputSchema.parse(await request.json()), { userId: auth.user.id, requestId });
    return successResponse(question, requestId, { status: 201 });
  });
}
