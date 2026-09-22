import { requireStudent } from "@/features/auth/authorization";
import { previewCheckout } from "@/features/commerce/service";
import { checkoutInputSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { const auth = await requireStudent(); const input = checkoutInputSchema.pick({ productId: true, couponCode: true }).parse(await request.json()); return successResponse(await previewCheckout(input.productId, input.couponCode, auth.user.id), requestId); }); }
