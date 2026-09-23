import { requireAuthenticated } from "@/features/auth/authorization";
import { revokeActiveSession } from "@/features/operations/service";
import { operationIdSchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireAuthenticated(); const { id } = await params; return successResponse(await revokeActiveSession(operationIdSchema.parse(id), { userId: auth.user.id, currentSessionId: auth.sessionId, requestId }), requestId); }); }
