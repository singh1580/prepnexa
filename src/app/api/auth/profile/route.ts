import { requireAuthenticated } from "@/features/auth/authorization";
import { updateProfile } from "@/features/auth/repository";
import { profileInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function POST(request: Request) {
  return executeRoute(request, async requestId => {
    const auth = await requireAuthenticated();
    const input = profileInputSchema.parse(await request.json());
    await updateProfile(auth.user.id, input);
    return successResponse({ name: input.name,phone:input.phone,classLevel:input.classLevel,board:input.board,targetExam:input.targetExam,dateOfBirth:input.dateOfBirth,emailNotifications:input.emailNotifications,inAppNotifications:input.inAppNotifications }, requestId);
  });
}
