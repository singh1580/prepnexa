import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { submitQuestion } from "@/features/admin-content/service";
import { entityIdSchema } from "@/features/admin-content/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.createQuestions);
    const result = await submitQuestion(entityIdSchema.parse((await params).id), { userId: auth.user.id, requestId });
    return successResponse(result, requestId);
  });
}
