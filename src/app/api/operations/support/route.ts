import { requireStudent } from "@/features/auth/authorization";
import { createStudentSupportTicket } from "@/features/operations/service";
import { createSupportTicketSchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { const auth = await requireStudent(); const input = createSupportTicketSchema.parse(await request.json()); return successResponse(await createStudentSupportTicket(input, { userId: auth.user.id, requestId }), requestId, { status: 201 }); }); }
