import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, sessions } from "@/db/schema";
import type { CreateSupportTicketInput } from "./validation";

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export function listActiveSessions(userId: string) {
  return db.select({ id: sessions.id, userAgent: sessions.userAgent, createdAt: sessions.createdAt, expiresAt: sessions.expiresAt })
    .from(sessions).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt));
}

export async function revokeOwnedSession(userId: string, sessionId: string) {
  const [session] = await db.update(sessions).set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id });
  return session;
}

export async function listStudentNotifications(userId: string) {
  const items = await db.select({ id: notifications.id, type: notifications.type, title: notifications.title, body: notifications.body, readAt: notifications.readAt, createdAt: notifications.createdAt })
    .from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  return { items, unreadCount: items.filter((item) => !item.readAt).length };
}

export async function markOwnedNotificationRead(userId: string, notificationId: string) {
  const [notification] = await db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  if (notification) return notification;
  return db.select({ id: notifications.id }).from(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).limit(1).then((items) => items[0]);
}

export async function markAllOwnedNotificationsRead(userId: string) {
  return db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))).returning({ id: notifications.id });
}

export async function insertNotification(input: { userId: string; type: string; deduplicationKey: string; title: string; body: string; email: boolean }) {
  const result = await db.execute(sql`
    with created as (
      insert into notifications (id,user_id,type,deduplication_key,title,body,created_at)
      values(${randomUUID()}::uuid,${input.userId}::uuid,${input.type},${input.deduplicationKey},${input.title},${input.body},now())
      on conflict(deduplication_key) do nothing returning id
    ), delivery as (
      insert into notification_deliveries (id,notification_id,channel,status,attempts,created_at)
      select ${randomUUID()}::uuid,id,'EMAIL','PENDING',0,now() from created where ${input.email}
      on conflict(notification_id,channel) do nothing returning id
    ) select created.id,delivery.id as "deliveryId" from created left join delivery on true
  `);
  return rows<{ id: string; deliveryId: string | null }>(result)[0];
}

export async function listManagedStudents() {
  const result = await db.execute(sql`
    select u.id,u.name,u.email,u.status,u.email_verified_at as "emailVerifiedAt",u.last_login_at as "lastLoginAt",u.created_at as "createdAt",
      (select count(*)::int from sessions s where s.user_id=u.id and s.revoked_at is null and s.expires_at>now()) as "activeSessions",
      (select count(*)::int from orders o where o.user_id=u.id) as "orderCount",
      (select count(*)::int from support_tickets t where t.user_id=u.id and t.status not in('RESOLVED','CLOSED')) as "openTickets"
    from users u where exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')
    order by u.created_at desc limit 250
  `);
  return rows<{ id:string;name:string;email:string;status:string;emailVerifiedAt:Date|null;lastLoginAt:Date|null;createdAt:Date;activeSessions:number;orderCount:number;openTickets:number }>(result);
}

export async function updateManagedStudentStatus(studentId: string, status: "ACTIVE" | "SUSPENDED", actor: { userId: string; requestId: string }) {
  const result = await db.execute(sql`
    with target as (
      select u.id,u.status from users u where u.id=${studentId}
        and exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')
        and not exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='ADMIN')
      for update
    ), changed as (
      update users u set status=${status}::user_status,updated_at=now() from target t where u.id=t.id returning u.id,t.status as "beforeStatus",u.status
    ), revoked as (
      update sessions set revoked_at=now() where user_id in(select id from changed) and ${status}='SUSPENDED' and revoked_at is null returning id
    ), audit as (
      insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,before,after)
      select ${actor.userId}::uuid,'student.status_changed','user',id::text,${actor.requestId},jsonb_build_object('status',"beforeStatus"),jsonb_build_object('status',status) from changed
    ) select id,status from changed
  `);
  return rows<{ id:string;status:string }>(result)[0];
}

export async function listManagedSupportTickets() {
  const result = await db.execute(sql`
    select t.id,t.subject,t.category,t.priority,t.status,t.created_at as "createdAt",t.updated_at as "updatedAt",u.name as "studentName",u.email,
      (select count(*)::int from support_messages m where m.ticket_id=t.id and not m.internal) as "messageCount"
    from support_tickets t join users u on u.id=t.user_id
    order by case t.priority when 'URGENT' then 0 when 'HIGH' then 1 when 'NORMAL' then 2 else 3 end,t.updated_at desc limit 250
  `);
  return rows<{id:string;subject:string;category:string;priority:string;status:string;createdAt:Date;updatedAt:Date;studentName:string;email:string;messageCount:number}>(result);
}

export async function findManagedSupportTicket(ticketId: string) {
  const result = await db.execute(sql`
    select t.id,t.user_id as "userId",t.subject,t.category,t.priority,t.status,t.order_id as "orderId",t.assigned_to as "assignedTo",t.created_at as "createdAt",t.updated_at as "updatedAt",u.name as "studentName",u.email
    from support_tickets t join users u on u.id=t.user_id where t.id=${ticketId} limit 1
  `);
  const ticket = rows<{id:string;userId:string;subject:string;category:string;priority:string;status:string;orderId:string|null;assignedTo:string|null;createdAt:Date;updatedAt:Date;studentName:string;email:string}>(result)[0];
  if (!ticket) return undefined;
  const messages = await db.execute(sql`
    select m.id,m.body,m.internal,m.created_at as "createdAt",m.author_id=t.user_id as "student"
    from support_messages m join support_tickets t on t.id=m.ticket_id where m.ticket_id=${ticketId} order by m.created_at
  `);
  return { ...ticket, messages: rows<{id:string;body:string;internal:boolean;createdAt:Date;student:boolean}>(messages) };
}

export async function insertManagedSupportReply(ticketId: string, body: string, actor: { userId: string; requestId: string }) {
  const messageId=randomUUID();
  const result=await db.execute(sql`
    with target as (select id,user_id from support_tickets where id=${ticketId} and status<>'CLOSED' for update),
    created as (insert into support_messages(id,ticket_id,author_id,body,internal,created_at) select ${messageId}::uuid,id,${actor.userId}::uuid,${body},false,now() from target returning id,ticket_id),
    changed as (update support_tickets set assigned_to=${actor.userId}::uuid,status='WAITING_FOR_STUDENT',updated_at=now() where id in(select ticket_id from created) returning id,user_id),
    audit as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id) select ${actor.userId}::uuid,'support.admin_replied','support_ticket',id::text,${actor.requestId} from changed)
    select id,user_id as "userId" from changed
  `);
  return rows<{id:string;userId:string}>(result)[0];
}

export async function updateManagedSupportTicket(ticketId:string,input:{status:string;priority:string},actor:{userId:string;requestId:string}) {
  const result=await db.execute(sql`
    with before as (select id,status,priority from support_tickets where id=${ticketId} for update),
    changed as (update support_tickets t set status=${input.status}::ticket_status,priority=${input.priority},assigned_to=${actor.userId}::uuid,updated_at=now(),resolved_at=case when ${input.status} in('RESOLVED','CLOSED') then now() else null end from before b where t.id=b.id returning t.id,t.user_id,b.status as "beforeStatus",b.priority as "beforePriority",t.status,t.priority),
    audit as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,before,after) select ${actor.userId}::uuid,'support.ticket_updated','support_ticket',id::text,${actor.requestId},jsonb_build_object('status',"beforeStatus",'priority',"beforePriority"),jsonb_build_object('status',status,'priority',priority) from changed)
    select id,user_id as "userId",status,priority from changed
  `);
  return rows<{id:string;userId:string;status:string;priority:string}>(result)[0];
}

export async function listManagedNotificationDeliveries() {
  const result=await db.execute(sql`
    select d.id,d.status,d.attempts,d.last_error as "lastError",d.sent_at as "sentAt",d.created_at as "createdAt",n.type,n.title,u.name,u.email
    from notification_deliveries d join notifications n on n.id=d.notification_id join users u on u.id=n.user_id
    order by case d.status when 'FAILED' then 0 when 'PENDING' then 1 else 2 end,d.created_at desc limit 250
  `);
  return rows<{id:string;status:string;attempts:number;lastError:string|null;sentAt:Date|null;createdAt:Date;type:string;title:string;name:string;email:string}>(result);
}

export async function findNotificationDelivery(deliveryId:string) {
  const result=await db.execute(sql`select d.id,d.status,d.attempts,n.title,n.body,u.name,u.email from notification_deliveries d join notifications n on n.id=d.notification_id join users u on u.id=n.user_id where d.id=${deliveryId} limit 1`);
  return rows<{id:string;status:string;attempts:number;title:string;body:string;name:string;email:string}>(result)[0];
}

export async function saveNotificationDelivery(deliveryId:string,input:{status:"SENT"|"FAILED";providerMessageId?:string|null;error?:string|null}) {
  await db.execute(sql`update notification_deliveries set status=${input.status},provider='resend',provider_message_id=${input.providerMessageId??null},last_error=${input.error?.slice(0,1000)??null},attempts=attempts+1,sent_at=case when ${input.status}='SENT' then now() else sent_at end where id=${deliveryId}`);
  return { id: deliveryId, status: input.status };
}

export async function listAuditActivity() {
  const result=await db.execute(sql`select a.id,a.action,a.entity_type as "entityType",a.entity_id as "entityId",a.created_at as "createdAt",u.name as "actorName",u.email as "actorEmail" from audit_logs a left join users u on u.id=a.actor_user_id order by a.created_at desc limit 250`);
  return rows<{id:string;action:string;entityType:string;entityId:string|null;createdAt:Date;actorName:string|null;actorEmail:string|null}>(result);
}

export async function getOperationsSummary() {
  const result=await db.execute(sql`select (select count(*)::int from users u where exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as students,(select count(*)::int from support_tickets where status not in('RESOLVED','CLOSED')) as "openTickets",(select count(*)::int from notification_deliveries where status in('PENDING','FAILED')) as "pendingDeliveries",(select count(*)::int from orders where status='PAID') as "paidOrders"`);
  return rows<{students:number;openTickets:number;pendingDeliveries:number;paidOrders:number}>(result)[0];
}

export async function getStudentOperationsSummary(userId:string) {
  const result=await db.execute(sql`
    select
      (select count(*)::int from tests t where t.status='PUBLISHED' and (exists(select 1 from product_tests pt join products p on p.id=pt.product_id where pt.test_id=t.id and p.status='PUBLISHED' and p.price_paise=0) or exists(select 1 from product_tests pt join entitlements e on e.product_id=pt.product_id where pt.test_id=t.id and e.user_id=${userId} and e.status='ACTIVE' and e.starts_at<=now() and e.expires_at>now()))) as tests,
      (select count(*)::int from materials m where m.status='PUBLISHED' and exists(select 1 from product_materials pm join products p on p.id=pm.product_id left join entitlements e on e.product_id=p.id and e.user_id=${userId} and e.status='ACTIVE' and e.starts_at<=now() and e.expires_at>now() where pm.material_id=m.id and p.status='PUBLISHED' and (p.price_paise=0 or e.id is not null))) as materials,
      (select count(distinct a.id)::int from attempts a join results r on r.attempt_id=a.id where a.user_id=${userId} and r.status in('PUBLISHED','REVISED')) as results,
      (select count(*)::int from orders where user_id=${userId}) as orders,
      (select count(*)::int from notifications where user_id=${userId} and read_at is null) as "unreadNotifications",
      (select count(*)::int from support_tickets where user_id=${userId} and status not in('RESOLVED','CLOSED')) as "openTickets"
  `);
  return rows<{tests:number;materials:number;results:number;orders:number;unreadNotifications:number;openTickets:number}>(result)[0];
}

export async function listStudentSupportTickets(userId: string) {
  const result = await db.execute(sql`
    select t.id, t.subject, t.category, t.priority, t.status, t.order_id as "orderId", t.created_at as "createdAt", t.updated_at as "updatedAt",
      (select count(*)::int from support_messages m where m.ticket_id=t.id and not m.internal) as "messageCount"
    from support_tickets t where t.user_id=${userId} order by t.updated_at desc limit 100
  `);
  return rows<{ id: string; subject: string; category: string; priority: string; status: string; orderId: string | null; createdAt: Date; updatedAt: Date; messageCount: number }>(result);
}

export async function findStudentSupportTicket(ticketId: string, userId: string) {
  const result = await db.execute(sql`
    select t.id, t.subject, t.category, t.priority, t.status, t.order_id as "orderId", t.created_at as "createdAt", t.updated_at as "updatedAt"
    from support_tickets t where t.id=${ticketId} and t.user_id=${userId} limit 1
  `);
  const ticket = rows<{ id: string; subject: string; category: string; priority: string; status: string; orderId: string | null; createdAt: Date; updatedAt: Date }>(result)[0];
  if (!ticket) return undefined;
  const messages = await db.execute(sql`
    select m.id, m.body, m.created_at as "createdAt", m.author_id=${userId}::uuid as "mine"
    from support_messages m where m.ticket_id=${ticketId} and not m.internal order by m.created_at
  `);
  return { ...ticket, messages: rows<{ id: string; body: string; createdAt: Date; mine: boolean }>(messages) };
}

export async function insertStudentSupportTicket(userId: string, input: CreateSupportTicketInput, requestId: string) {
  const ticketId = randomUUID(); const messageId = randomUUID();
  const result = await db.execute(sql`
    with owned_order as (
      select id from orders where id=${input.orderId ?? null}::uuid and user_id=${userId}
    ), created_ticket as (
      insert into support_tickets (id,user_id,order_id,subject,category,priority,status,created_at,updated_at)
      select ${ticketId}::uuid,${userId}::uuid,
        case when ${input.orderId ?? null}::uuid is null then null else (select id from owned_order) end,
        ${input.subject},${input.category},'NORMAL','OPEN',now(),now()
      where ${input.orderId ?? null}::uuid is null or exists(select 1 from owned_order)
      returning id
    ), created_message as (
      insert into support_messages (id,ticket_id,author_id,body,internal,created_at)
      select ${messageId}::uuid,id,${userId}::uuid,${input.message},false,now() from created_ticket returning id
    ), audit as (
      insert into audit_logs (actor_user_id,action,entity_type,entity_id,request_id,after)
      select ${userId}::uuid,'support.ticket_created','support_ticket',id::text,${requestId},jsonb_build_object('category',${input.category}) from created_ticket
    ) select id from created_ticket
  `);
  return rows<{ id: string }>(result)[0];
}

export async function insertStudentSupportReply(ticketId: string, userId: string, body: string, requestId: string) {
  const messageId = randomUUID();
  const result = await db.execute(sql`
    with owned_ticket as (
      select id,status from support_tickets where id=${ticketId} and user_id=${userId} and status <> 'CLOSED'
    ), created_message as (
      insert into support_messages (id,ticket_id,author_id,body,internal,created_at)
      select ${messageId}::uuid,id,${userId}::uuid,${body},false,now() from owned_ticket returning id,ticket_id
    ), updated_ticket as (
      update support_tickets set status=case when status='WAITING_FOR_STUDENT' then 'OPEN' else status end,updated_at=now()
      where id in (select ticket_id from created_message) returning id
    ), audit as (
      insert into audit_logs (actor_user_id,action,entity_type,entity_id,request_id)
      select ${userId}::uuid,'support.student_replied','support_ticket',id::text,${requestId} from updated_ticket
    ) select id from created_message
  `);
  return rows<{ id: string }>(result)[0];
}
