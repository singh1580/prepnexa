import { requireAdmin } from "@/features/auth/authorization";
import { createCoupon } from "@/features/commerce/service";
import { couponInputSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { const auth = await requireAdmin(); return successResponse(await createCoupon(couponInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId, { status: 201 }); }); }
