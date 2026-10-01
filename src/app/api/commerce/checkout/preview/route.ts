import { requireStudent } from "@/features/auth/authorization";
import { previewCheckout } from "@/features/commerce/service";
import { checkoutPreviewSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { const auth = await requireStudent(); const input = checkoutPreviewSchema.parse(await request.json()); return successResponse(await previewCheckout(input.productIds, input.couponCode, auth.user.id), requestId); }); }
