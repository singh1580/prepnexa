import { requireAuthenticated } from "@/features/auth/authorization";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getSupportAttachment } from "@/features/operations/service";
import { operationIdSchema } from "@/features/operations/validation";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await requireAuthenticated();const attachment=await getSupportAttachment(operationIdSchema.parse((await params).id),auth.user.id,auth.permissions.includes(OPERATIONS_PERMISSIONS.manageSupport));
  return new Response(Buffer.from(attachment.bytes),{headers:{"Content-Type":attachment.contentType,"Content-Disposition":`inline; filename="${attachment.fileName.replace(/["\\]/g,"_")}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
