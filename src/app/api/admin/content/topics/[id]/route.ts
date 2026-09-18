import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { updateTopic } from "@/features/admin-content/service";
import { entityIdSchema, topicInputSchema } from "@/features/admin-content/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.manageExams);
    const id = entityIdSchema.parse((await params).id);
    return successResponse(await updateTopic(id, topicInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId);
  });
}
