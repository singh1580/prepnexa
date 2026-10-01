import { requirePermission } from "@/features/auth/authorization";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { replyToManagedSupportTicket } from "@/features/operations/service";
import { removeSupportAttachment, storeSupportAttachment } from "@/features/operations/support-attachments";
import { managedSupportReplySchema, operationIdSchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return executeRoute(request, async (requestId) => {
    const auth = await requirePermission(OPERATIONS_PERMISSIONS.manageSupport); const ticketId = operationIdSchema.parse((await params).id); const form = await request.formData();
    const input = managedSupportReplySchema.parse({ body: form.get("body"), internal: form.get("internal") === "true" }); const upload = form.get("attachment"); const attachment = await storeSupportAttachment(ticketId, upload instanceof File ? upload : null);
    try { return successResponse(await replyToManagedSupportTicket(ticketId, input, { userId: auth.user.id, requestId }, attachment), requestId, { status: 201 }); }
    catch (error) { await removeSupportAttachment(attachment); throw error; }
  });
}
