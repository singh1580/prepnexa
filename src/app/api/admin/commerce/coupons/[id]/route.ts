import { requireAdmin } from "@/features/auth/authorization";
import { updateCoupon } from "@/features/commerce/service";
import { commerceIdSchema, couponInputSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireAdmin(); return successResponse(await updateCoupon(commerceIdSchema.parse((await params).id), couponInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId); }); }
