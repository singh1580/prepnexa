import { requireStudent } from "@/features/auth/authorization";
import { getStudentResult } from "@/features/student-results/service";
import { entityIdSchema } from "@/features/student-tests/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return executeRoute(request, async requestId => { const auth = await requireStudent(); return successResponse(await getStudentResult(entityIdSchema.parse((await params).id), auth.user.id), requestId); }); }
