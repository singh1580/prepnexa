import { requireStudent } from "@/features/auth/authorization";
import { replyToStudentSupportTicket } from "@/features/operations/service";
import { removeSupportAttachment, storeSupportAttachment } from "@/features/operations/support-attachments";
import { operationIdSchema, supportReplySchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requireStudent(); const ticketId = operationIdSchema.parse((await params).id); const form = await request.formData();
    const input = supportReplySchema.parse({ body: form.get("body") }); const upload = form.get("attachment"); const attachment = await storeSupportAttachment(ticketId, upload instanceof File ? upload : null);
    try { return successResponse(await replyToStudentSupportTicket(ticketId, input, { userId: auth.user.id, requestId }, attachment), requestId, { status: 201 }); }
    catch (error) { await removeSupportAttachment(attachment); throw error; }
  });
}
