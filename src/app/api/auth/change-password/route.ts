import { requireAuthenticated } from "@/features/auth/authorization";
import { changePassword } from "@/features/auth/service";
import { changePasswordInputSchema } from "@/features/auth/validation";
import { successResponse } from "@/lib/http/api-response";
import { executeRoute } from "@/lib/http/route-handler";

export async function POST(request:Request){return executeRoute(request,async requestId=>{const auth=await requireAuthenticated();const input=changePasswordInputSchema.parse(await request.json());await changePassword(auth.user.id,auth.sessionId,input);return successResponse({passwordChanged:true},requestId);});}
