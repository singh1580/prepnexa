import { requireStudent } from "@/features/auth/authorization";
import { submitStudentReview } from "@/features/reviews/service";
import { submitReviewSchema } from "@/features/reviews/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    const input = submitReviewSchema.parse(await request.json());
    return successResponse(await submitStudentReview(auth.user.id, input), requestId, { status: 201 });
  });
}
