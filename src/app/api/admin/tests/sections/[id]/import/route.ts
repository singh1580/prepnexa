import { z } from "zod";
import { requirePermissions } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { importTestCsv } from "@/features/admin-tests/question-import";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

const input = z.object({ topicId: z.uuid(), csv: z.string().min(1).max(1_000_000) }).strict();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requirePermissions([CONTENT_PERMISSIONS.manageTests, CONTENT_PERMISSIONS.createQuestions]);
    const sectionId = z.uuid().parse((await params).id);
    const body = input.parse(await request.json());
    const result = await importTestCsv(sectionId, body.topicId, body.csv, { userId: auth.user.id, requestId });
    return successResponse(result, requestId, { status: result.status === "IMPORTED" ? 201 : 200 });
  });
}
