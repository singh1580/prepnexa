import { requirePermission } from "@/features/auth/authorization";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { createNotificationCampaign } from "@/features/operations/service";
import { notificationCampaignSchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(OPERATIONS_PERMISSIONS.manageNotifications);
    const result = await createNotificationCampaign(notificationCampaignSchema.parse(await request.json()), { userId: auth.user.id, requestId });
    return successResponse(result, requestId, { status: 201 });
  });
}
