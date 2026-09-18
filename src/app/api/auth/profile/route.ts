import { requireAuthenticated } from "@/features/auth/authorization";
import { updateProfileName } from "@/features/auth/repository";
import { profileInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const auth = await requireAuthenticated();
    const input = profileInputSchema.parse(await request.json());
    await updateProfileName(auth.user.id, input.name);
    return successResponse({ name: input.name }, requestId);
  });
}

