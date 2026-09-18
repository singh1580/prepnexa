import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
import { login } from "@/features/auth/service";
import { loginInputSchema } from "@/features/auth/validation";
import { setSessionCookie } from "@/features/auth/session-cookie";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const input = loginInputSchema.parse(await request.json());
    const result = await login(input, {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    if (result.mfaRequired) return successResponse({ mfaRequired: true, challengeToken: result.challengeToken, expiresAt: result.expiresAt.toISOString(), user: result.user }, requestId);
    await setSessionCookie(result.token, result.expiresAt);
    return successResponse({ mfaRequired: false, user: result.user, expiresAt: result.expiresAt.toISOString() }, requestId);
  });
}
