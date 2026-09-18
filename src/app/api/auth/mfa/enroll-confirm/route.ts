import { requireEnrollmentChallenge, limitMfaAttempt } from "@/features/auth/enrollment";
import { confirmMfa } from "@/features/auth/mfa";
import { hashIdentifier } from "@/features/auth/crypto";
import { consumeMfaChallenge } from "@/features/auth/repository";
import { mfaEnrollmentConfirmSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const input = mfaEnrollmentConfirmSchema.parse(await request.json());
    const user = await requireEnrollmentChallenge(input.challengeToken);
    await limitMfaAttempt(user.email);
    const result = await confirmMfa(user, input.code);
    await consumeMfaChallenge(hashIdentifier(input.challengeToken), user.id);
    return successResponse(result, requestId);
  });
}

