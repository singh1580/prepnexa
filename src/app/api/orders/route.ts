import { requireStudent } from "@/features/auth/authorization";
import { getStudentOrders } from "@/features/commerce/service";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request: Request) { return executeRoute(request, async requestId => { const auth = await requireStudent(); return successResponse(await getStudentOrders(auth.user.id), requestId); }); }
