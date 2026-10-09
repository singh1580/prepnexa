import { requirePermission } from "@/features/auth/authorization";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedStudents } from "@/features/operations/service";
import { toIsoString, toOptionalIsoString } from "@/lib/date-time";
import { csvCell } from "@/lib/csv";
import { executeRoute } from "@/lib/http/route-handler";

export async function GET(request:Request){return executeRoute(request,async requestId=>{await requirePermission(OPERATIONS_PERMISSIONS.readStudents);const students=await getManagedStudents();const lines=[["Name","Email","Status","Email verified","Joined","Last login","Active devices","Orders","Open tickets"],...students.map(student=>[student.name,student.email,student.status,student.emailVerifiedAt?"Yes":"No",toIsoString(student.createdAt),toOptionalIsoString(student.lastLoginAt)??"",student.activeSessions,student.orderCount,student.openTickets])];return new Response(lines.map(row=>row.map(csvCell).join(",")).join("\n"),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="prepstore-students-${new Date().toISOString().slice(0,10)}.csv"`,"x-request-id":requestId,"cache-control":"no-store"}});});}
