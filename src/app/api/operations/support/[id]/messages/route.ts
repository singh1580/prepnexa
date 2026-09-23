import { requireStudent } from "@/features/auth/authorization";
import { replyToStudentSupportTicket } from "@/features/operations/service";
import { operationIdSchema, supportReplySchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireStudent(); const input = supportReplySchema.parse(await request.json()); return successResponse(await replyToStudentSupportTicket(operationIdSchema.parse((await params).id), input, { userId: auth.user.id, requestId }), requestId, { status: 201 }); }); }
