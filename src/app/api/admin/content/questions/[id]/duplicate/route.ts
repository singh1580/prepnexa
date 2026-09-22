import { requirePermission } from "@/features/auth/authorization";
import { duplicateQuestion } from "@/features/admin-content/service";
import { entityIdSchema } from "@/features/admin-content/validation";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission("question.create");
    return successResponse(await duplicateQuestion(entityIdSchema.parse((await params).id), { userId: auth.user.id, requestId }), requestId, { status: 201 });
  });
}
