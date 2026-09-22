import { requireStudent } from "@/features/auth/authorization";
import { saveAttemptAnswer } from "@/features/student-tests/service";
import { answerInputSchema, entityIdSchema } from "@/features/student-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; snapshotId: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    const values = await params;
    const result = await saveAttemptAnswer(entityIdSchema.parse(values.id), entityIdSchema.parse(values.snapshotId), answerInputSchema.parse(await request.json()), { userId: auth.user.id, requestId });
    return successResponse(result, requestId);
  });
}
