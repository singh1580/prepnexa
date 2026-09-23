import { requireAuthenticated } from "@/features/auth/authorization";
import { readNotification } from "@/features/operations/service";
import { operationIdSchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireAuthenticated(); return successResponse(await readNotification(operationIdSchema.parse((await params).id), auth.user.id), requestId); }); }
