import { resendEmailVerification } from "@/features/auth/service";
import { emailInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => successResponse(await resendEmailVerification(emailInputSchema.parse(await request.json())), requestId));
}
