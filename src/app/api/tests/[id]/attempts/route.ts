import { requireStudent } from "@/features/auth/authorization";
import { startOrResumeAttempt } from "@/features/student-tests/service";
import { entityIdSchema } from "@/features/student-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    const result = await startOrResumeAttempt(entityIdSchema.parse((await params).id), { userId: auth.user.id, requestId });
    return successResponse(result, requestId, { status: result.resumed ? 200 : 201 });
  });
}
