import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { submitQuestion } from "@/features/admin-content/service";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async () => {
    await requirePermission(CONTENT_PERMISSIONS.publishQuestions);
    return submitQuestion();
  });
}
