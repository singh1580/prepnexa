import { requireEnrollmentChallenge } from "@/features/auth/enrollment";
import { setupMfa } from "@/features/auth/mfa";
import { mfaEnrollmentInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const { challengeToken } = mfaEnrollmentInputSchema.parse(await request.json());
    const user = await requireEnrollmentChallenge(challengeToken);
    return successResponse(await setupMfa(user), requestId);
  });
}

