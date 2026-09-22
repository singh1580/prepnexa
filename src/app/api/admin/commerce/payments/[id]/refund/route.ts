import { requireAdmin } from "@/features/auth/authorization";
import { refundPayment } from "@/features/commerce/service";
import { commerceIdSchema, refundInputSchema } from "@/features/commerce/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireAdmin(); return successResponse(await refundPayment(commerceIdSchema.parse((await params).id), refundInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }), requestId, { status: 201 }); }); }
