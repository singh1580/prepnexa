import { requirePermission } from "@/features/auth/authorization";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedStudents } from "@/features/operations/service";

const cell=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
export async function GET(){await requirePermission(OPERATIONS_PERMISSIONS.readStudents);const students=await getManagedStudents();const lines=[["Name","Email","Status","Email verified","Joined","Last login","Active devices","Orders","Open tickets"],...students.map(student=>[student.name,student.email,student.status,student.emailVerifiedAt?"Yes":"No",student.createdAt.toISOString(),student.lastLoginAt?.toISOString()??"",student.activeSessions,student.orderCount,student.openTickets])];return new Response(lines.map(row=>row.map(cell).join(",")).join("\n"),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="prepstore-students-${new Date().toISOString().slice(0,10)}.csv"`}})}
