import { requireAdmin } from "@/features/auth/authorization";
import { setCouponActive } from "@/features/commerce/service";
import { commerceIdSchema, couponStatusSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireAdmin(); const input = couponStatusSchema.parse(await request.json()); return successResponse(await setCouponActive(commerceIdSchema.parse((await params).id), input.active, { userId: auth.user.id, requestId }), requestId); }); }
