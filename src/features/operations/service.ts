import { logger } from "@/lib/logger";
import { closedTicket, currentSessionRevoke, operationNotFound } from "./errors";
import { findManagedSupportTicket, findNotificationDelivery, findStudentSupportTicket, getOperationsSummary, getStudentOperationsSummary, insertManagedSupportReply, insertNotification, insertStudentSupportReply, insertStudentSupportTicket, listActiveSessions, listAuditActivity, listManagedNotificationDeliveries, listManagedStudents, listManagedSupportTickets, listStudentNotifications, listStudentSupportTickets, markAllOwnedNotificationsRead, markOwnedNotificationRead, revokeOwnedSession, saveNotificationDelivery, updateManagedStudentStatus, updateManagedSupportTicket } from "./repository";
import { sendOperationsEmail } from "./notifier";
import type { CreateSupportTicketInput, SupportReplyInput } from "./validation";

export async function getActiveSessions(userId: string, currentSessionId: string) {
  return (await listActiveSessions(userId)).map((session) => ({ ...session, current: session.id === currentSessionId }));
}
export async function revokeActiveSession(sessionId: string, actor: { userId: string; currentSessionId: string; requestId: string }) {
  if (sessionId === actor.currentSessionId) throw currentSessionRevoke();
  const session = await revokeOwnedSession(actor.userId, sessionId);
  if (!session) throw operationNotFound("Active session");
  logger.info({ requestId: actor.requestId, module: "operations", action: "session_revoke", actorUserId: actor.userId, sessionId }, "Student session revoked");
  return session;
}
export const getStudentNotifications = (userId: string) => listStudentNotifications(userId);
export async function readNotification(notificationId: string, userId: string) { const value = await markOwnedNotificationRead(userId, notificationId); if (!value) throw operationNotFound("Notification"); return value; }
export async function readAllNotifications(userId: string) { const values = await markAllOwnedNotificationsRead(userId); return { updated: values.length }; }
export const getStudentSupportTickets = (userId: string) => listStudentSupportTickets(userId);
export async function getStudentSupportTicket(ticketId: string, userId: string) { const ticket = await findStudentSupportTicket(ticketId, userId); if (!ticket) throw operationNotFound("Support ticket"); return ticket; }
export async function createStudentSupportTicket(input: CreateSupportTicketInput, actor: { userId: string; requestId: string }) {
  const ticket = await insertStudentSupportTicket(actor.userId, input, actor.requestId);
  if (!ticket) throw operationNotFound(input.orderId ? "Order" : "Support ticket");
  logger.info({ requestId: actor.requestId, module: "operations", action: "support_ticket_create", actorUserId: actor.userId, ticketId: ticket.id }, "Support ticket created");
  return ticket;
}
export async function replyToStudentSupportTicket(ticketId: string, input: SupportReplyInput, actor: { userId: string; requestId: string }) {
  const ticket = await findStudentSupportTicket(ticketId, actor.userId);
  if (!ticket) throw operationNotFound("Support ticket");
  if (ticket.status === "CLOSED") throw closedTicket();
  const message = await insertStudentSupportReply(ticketId, actor.userId, input.body, actor.requestId);
  if (!message) throw closedTicket();
  return message;
}

export async function queueStudentNotification(input: { userId: string; type: string; deduplicationKey: string; title: string; body: string; email?: boolean; requestId: string }) {
  try { const notification=await insertNotification({ ...input, email: input.email ?? true }); if(notification?.deliveryId) await deliverNotification(notification.deliveryId,input.requestId); return notification; }
  catch (error) { logger.error({ requestId: input.requestId, module: "operations", action: "notification_queue_failed", type: input.type, errorType: error instanceof Error ? error.name : "UnknownError" }, "Notification queue failed without rolling back the primary operation"); return undefined; }
}

export const getManagedStudents=()=>listManagedStudents();
export async function setManagedStudentStatus(studentId:string,status:"ACTIVE"|"SUSPENDED",actor:{userId:string;requestId:string}) { const value=await updateManagedStudentStatus(studentId,status,actor); if(!value) throw operationNotFound("Student"); return value; }
export const getManagedSupportTickets=()=>listManagedSupportTickets();
export async function getManagedSupportTicket(ticketId:string) { const value=await findManagedSupportTicket(ticketId); if(!value) throw operationNotFound("Support ticket"); return value; }
export async function replyToManagedSupportTicket(ticketId:string,input:SupportReplyInput,actor:{userId:string;requestId:string}) { const ticket=await findManagedSupportTicket(ticketId); if(!ticket) throw operationNotFound("Support ticket"); if(ticket.status==="CLOSED") throw closedTicket(); const value=await insertManagedSupportReply(ticketId,input.body,actor); if(!value) throw closedTicket(); await queueStudentNotification({userId:value.userId,type:"SUPPORT_UPDATED",deduplicationKey:`support-reply:${ticketId}:${value.id}`,title:"Support replied",body:`PrepNexa Support replied to “${ticket.subject}”.`,requestId:actor.requestId}); return value; }
export async function setManagedSupportTicket(ticketId:string,input:{status:"OPEN"|"IN_PROGRESS"|"WAITING_FOR_STUDENT"|"RESOLVED"|"CLOSED";priority:"LOW"|"NORMAL"|"HIGH"|"URGENT"},actor:{userId:string;requestId:string}) { const value=await updateManagedSupportTicket(ticketId,input,actor); if(!value) throw operationNotFound("Support ticket"); await queueStudentNotification({userId:value.userId,type:"SUPPORT_UPDATED",deduplicationKey:`support-status:${ticketId}:${value.status}:${value.priority}`,title:"Support ticket updated",body:`Your support ticket status is now ${value.status.replaceAll("_"," ").toLowerCase()}.`,requestId:actor.requestId}); return value; }
export const getManagedNotificationDeliveries=()=>listManagedNotificationDeliveries();
export const getAuditActivity=()=>listAuditActivity();
export const getAdminOperationsSummary=()=>getOperationsSummary();
export const getStudentDashboardSummary=(userId:string)=>getStudentOperationsSummary(userId);

export async function deliverNotification(deliveryId:string,requestId:string) {
  const delivery=await findNotificationDelivery(deliveryId); if(!delivery) throw operationNotFound("Notification delivery");
  if(delivery.status==="SENT") return {id:delivery.id,status:"SENT" as const};
  try { const providerMessageId=await sendOperationsEmail({deliveryId:delivery.id,to:delivery.email,name:delivery.name,title:delivery.title,body:delivery.body}); return await saveNotificationDelivery(delivery.id,{status:"SENT",providerMessageId}); }
  catch(error) { const reason=error instanceof Error?error.message:"Email delivery failed."; await saveNotificationDelivery(delivery.id,{status:"FAILED",error:reason}); logger.error({requestId,module:"operations",action:"notification_delivery_failed",deliveryId,errorType:error instanceof Error?error.name:"UnknownError"},"Notification email failed and remains retryable"); return {id:delivery.id,status:"FAILED" as const}; }
}
