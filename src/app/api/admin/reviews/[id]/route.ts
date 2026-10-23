import { z } from "zod";
import { requireAdmin } from "@/features/auth/authorization";
import { reviewModeration } from "@/features/reviews/service";
import { moderateReviewSchema } from "@/features/reviews/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async requestId => {
    const auth = await requireAdmin();
    const input = moderateReviewSchema.parse(await request.json());
    return successResponse(await reviewModeration(z.uuid().parse((await params).id), auth.user.id, input, requestId), requestId);
  });
}
