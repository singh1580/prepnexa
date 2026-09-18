import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { reviewQuestion } from "@/features/admin-content/service";
import { entityIdSchema, reviewActionSchema } from "@/features/admin-content/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.reviewQuestions);
    const action = reviewActionSchema.parse(await request.json()).action;
    const result = await reviewQuestion(entityIdSchema.parse((await params).id), action, { userId: auth.user.id, requestId });
    return successResponse(result, requestId);
  });
}
