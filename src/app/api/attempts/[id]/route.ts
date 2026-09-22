import { requireStudent } from "@/features/auth/authorization";
import { getAttempt } from "@/features/student-tests/service";
import { entityIdSchema } from "@/features/student-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    return successResponse(await getAttempt(entityIdSchema.parse((await params).id), auth.user.id), requestId);
  });
}
