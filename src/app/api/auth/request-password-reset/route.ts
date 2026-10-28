import { requestPasswordReset } from "@/features/auth/service";
import { emailInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
import { clientIp } from "@/lib/http/client-ip";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => successResponse(await requestPasswordReset(emailInputSchema.parse(await request.json()), { ip: clientIp(request) }), requestId));
}
