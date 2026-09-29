import { z } from "zod";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { setProductLive } from "@/features/admin-catalog/service";
import { catalogIdSchema } from "@/features/admin-catalog/validation";
import { requirePermission } from "@/features/auth/authorization";
import { executeRoute } from "@/lib/http/route-handler";
import { successResponse } from "@/lib/http/api-response";

const inputSchema = z.object({ isLive: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(CONTENT_PERMISSIONS.manageProducts);
    const { isLive } = inputSchema.parse(await request.json());
    const result = await setProductLive(
      catalogIdSchema.parse((await params).id),
      isLive,
      { userId: auth.user.id, requestId },
    );
    return successResponse(result, requestId);
  });
}
