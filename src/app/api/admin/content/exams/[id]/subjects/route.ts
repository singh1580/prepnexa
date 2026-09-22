import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createSubject } from "@/features/admin-content/service";
import { entityIdSchema, subjectInputSchema } from "@/features/admin-content/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.manageExams);
    const examId = entityIdSchema.parse((await params).id);
    const subject = await createSubject(examId, subjectInputSchema.parse(await request.json()), { userId: auth.user.id, requestId });
    return successResponse(subject, requestId, { status: 201 });
  });
}
