import { requireStudent } from "@/features/auth/authorization";
import { submitAttempt } from "@/features/student-tests/service";
import { entityIdSchema } from "@/features/student-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    return successResponse(await submitAttempt(entityIdSchema.parse((await params).id), { userId: auth.user.id, requestId }), requestId);
  });
}
