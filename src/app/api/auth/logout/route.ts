import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
import { logout } from "@/features/auth/service";
import { clearSessionCookie, readSessionCookie } from "@/features/auth/session-cookie";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    await logout(await readSessionCookie());
    await clearSessionCookie();
    return successResponse({ loggedOut: true }, requestId);
  });
}
