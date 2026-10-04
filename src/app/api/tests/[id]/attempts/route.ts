import { requireStudent } from "@/features/auth/authorization";
import { startOrResumeAttempt } from "@/features/student-tests/service";
import { attemptStartInputSchema, entityIdSchema } from "@/features/student-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    const input = attemptStartInputSchema.parse(
      await request.json().catch(() => ({})),
    );
    const result = await startOrResumeAttempt(entityIdSchema.parse((await params).id), input.courseSlug, { userId: auth.user.id, requestId });
    return successResponse(result, requestId, { status: result.resumed ? 200 : 201 });
  });
}
