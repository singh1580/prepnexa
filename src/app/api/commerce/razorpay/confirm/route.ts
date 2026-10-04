import { requireStudent } from "@/features/auth/authorization";
import { confirmRazorpayPayment } from "@/features/commerce/service";
import { razorpayConfirmationSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const auth = await requireStudent();
    const input = razorpayConfirmationSchema.parse(await request.json());
    return successResponse(await confirmRazorpayPayment(input, { userId: auth.user.id, email: auth.user.email, name: auth.user.name, requestId }), requestId);
  });
}
