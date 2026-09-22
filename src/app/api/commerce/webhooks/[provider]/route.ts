import { handlePaymentWebhook } from "@/features/commerce/service";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) { return executeRoute(request, async requestId => { const rawBody = await request.text(); return successResponse(await handlePaymentWebhook((await params).provider.toLowerCase(), rawBody, request.headers, requestId), requestId); }); }
