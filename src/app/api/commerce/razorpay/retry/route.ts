import { requireStudent } from "@/features/auth/authorization";
import { retryRazorpayPayment } from "@/features/commerce/service";
import { razorpayRetrySchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const auth=await requireStudent();
    const input=razorpayRetrySchema.parse(await request.json());
    return successResponse(await retryRazorpayPayment(input.attemptId,{userId:auth.user.id,email:auth.user.email,name:auth.user.name,phone:auth.user.phone,requestId}),requestId);
  });
}
