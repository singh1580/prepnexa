import { verifyEmail } from "@/features/auth/service";
import { tokenInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => successResponse(await verifyEmail(tokenInputSchema.parse(await request.json()).token), requestId));
}
