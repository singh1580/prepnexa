import { requireStudent } from "@/features/auth/authorization";
import { getStudentResults } from "@/features/student-results/service";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request: Request) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    return successResponse(await getStudentResults(auth.user.id), requestId);
  });
}
