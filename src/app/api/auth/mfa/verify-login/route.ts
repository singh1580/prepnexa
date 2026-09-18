import { verifyMfaLogin } from "@/features/auth/mfa";
import { setSessionCookie } from "@/features/auth/session-cookie";
import { mfaLoginInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const input = mfaLoginInputSchema.parse(await request.json());
    const result = await verifyMfaLogin(input, { ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(), userAgent: request.headers.get("user-agent") ?? undefined });
    await setSessionCookie(result.token, result.expiresAt);
    return successResponse({ user: result.user, expiresAt: result.expiresAt.toISOString() }, requestId);
  });
}
