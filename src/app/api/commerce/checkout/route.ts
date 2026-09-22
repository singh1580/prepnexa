import { requireStudent } from "@/features/auth/authorization";
import { createCheckout } from "@/features/commerce/service";
import { checkoutInputSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { const auth = await requireStudent(); const result = await createCheckout(checkoutInputSchema.parse(await request.json()), { userId: auth.user.id, email: auth.user.email, name: auth.user.name, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
