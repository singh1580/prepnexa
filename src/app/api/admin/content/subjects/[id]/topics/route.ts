import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createTopic } from "@/features/admin-content/service";
import { entityIdSchema, topicInputSchema } from "@/features/admin-content/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.manageExams);
    const subjectId = entityIdSchema.parse((await params).id);
    const topic = await createTopic(subjectId, topicInputSchema.parse(await request.json()), { userId: auth.user.id, requestId });
    return successResponse(topic, requestId, { status: 201 });
  });
}
