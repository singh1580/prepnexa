import { requireAdmin } from "@/features/auth/authorization";
import { confirmMfa } from "@/features/auth/mfa";
import { mfaConfirmInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const [auth, input] = await Promise.all([requireAdmin(), request.json().then((body) => mfaConfirmInputSchema.parse(body))]);
    return successResponse(await confirmMfa(auth.user, input.code), requestId);
  });
}
