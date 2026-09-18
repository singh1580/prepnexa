import { requirePermission } from "@/features/auth/authorization";
import { CONTENT_PERMISSIONS } from "@/features/admin-content/permissions";
import { createSchedule } from "@/features/admin-tests/service";
import { scheduleInputSchema, testIdSchema } from "@/features/admin-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async (requestId) => { const auth = await requirePermission(CONTENT_PERMISSIONS.manageSchedules); const result = await createSchedule(testIdSchema.parse((await params).id), scheduleInputSchema.parse(await request.json()), { userId: auth.user.id, requestId }); return successResponse(result, requestId, { status: 201 }); }); }
