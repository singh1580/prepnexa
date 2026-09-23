import { requirePermission } from "@/features/auth/authorization";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { setManagedStudentStatus } from "@/features/operations/service";
import { managedStudentStatusSchema, operationIdSchema } from "@/features/operations/validation";
import { successResponse } from "@/lib/http/api-response";import { executeRoute } from "@/lib/http/route-handler";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return executeRoute(request,async requestId=>{const auth=await requirePermission(OPERATIONS_PERMISSIONS.manageStudents);const input=managedStudentStatusSchema.parse(await request.json());return successResponse(await setManagedStudentStatus(operationIdSchema.parse((await params).id),input.status,{userId:auth.user.id,requestId}),requestId);});}
