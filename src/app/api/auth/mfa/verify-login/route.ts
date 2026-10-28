import { verifyMfaLogin } from "@/features/auth/mfa";
import { setSessionCookie } from "@/features/auth/session-cookie";
import { mfaLoginInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
import { clientIp } from "@/lib/http/client-ip";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const input = mfaLoginInputSchema.parse(await request.json());
    const result = await verifyMfaLogin(input, { ip: clientIp(request), userAgent: request.headers.get("user-agent") ?? undefined });
    await setSessionCookie(result.token, result.expiresAt);
    return successResponse({ user: result.user, expiresAt: result.expiresAt.toISOString() }, requestId);
  });
}
