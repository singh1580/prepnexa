import { requireStudent } from "@/features/auth/authorization";
import { reconcileRazorpayPayment } from "@/features/commerce/service";
import { razorpayStatusSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    const input = razorpayStatusSchema.parse(await request.json());
    return successResponse(await reconcileRazorpayPayment(input.attemptId, { userId: auth.user.id, email: auth.user.email, name: auth.user.name, phone: auth.user.phone, requestId }), requestId);
  });
}
