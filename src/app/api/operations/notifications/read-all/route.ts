import { requireAuthenticated } from "@/features/auth/authorization";
import { readAllNotifications } from "@/features/operations/service";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request: Request) { return executeRoute(request, async requestId => { const auth = await requireAuthenticated(); return successResponse(await readAllNotifications(auth.user.id), requestId); }); }
