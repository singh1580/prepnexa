import { z } from "zod";
import { requirePermissions } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { questionInputSchema } from "@/features/admin-content/validation";
import { addTestQuestions } from "@/features/admin-tests/question-import";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requirePermissions([CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.createQuestions]);
    const sectionId = z.uuid().parse((await params).id);
    const input = questionInputSchema.parse(await request.json());
    const result = await addTestQuestions(sectionId, [input], { userId: auth.user.id, requestId });
    return successResponse(result, requestId, { status: 201 });
  });
}
