import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";
import { register } from "@/features/auth/service";
import { registerInputSchema } from "@/features/auth/validation";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const input = registerInputSchema.parse(await request.json());
    const user = await register(input);
    return successResponse(user, requestId, { status: 201 });
  });
}
