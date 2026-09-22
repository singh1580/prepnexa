import { env } from "@/config/env";
import { requireStudent } from "@/features/auth/authorization";
import { confirmMockPayment } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { invalidCommerceState } from "@/features/commerce/errors";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { if (env.NODE_ENV === "production") throw invalidCommerceState("Test payments are disabled in production."); const auth = await requireStudent(); const body = await request.json(); return successResponse(await confirmMockPayment(commerceIdSchema.parse(body.attemptId), { userId: auth.user.id, email: auth.user.email, name: auth.user.name, requestId }), requestId); }); }
