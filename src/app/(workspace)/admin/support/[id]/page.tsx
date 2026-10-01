import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedSupportTicket } from "@/features/operations/service";
import { ManagedTicketActions } from "@/features/operations/ui/admin-actions";
import { AppError } from "@/lib/errors/app-error";
export const metadata = { title: "Manage support ticket" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspacePermission(
    OPERATIONS_PERMISSIONS.manageSupport,
  );
  let ticket: Awaited<ReturnType<typeof getManagedSupportTicket>>;
  try {
    ticket = await getManagedSupportTicket((await params).id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      permissions={auth.permissions}
      section="support"
    >
      <Link className="back-link" href="/admin/support">← Support tickets</Link>
      <section className="admin-ticket-panel">
        <header className="ticket-detail-heading"><div><span className="eyebrow">#{ticket.id.slice(0, 8)}</span><h1>{ticket.subject}</h1></div><span className={`status-pill content-${ticket.status.toLowerCase()}`}>{ticket.status.replaceAll("_", " ")}</span></header>
        <div className="ticket-student-strip"><span className="avatar">{ticket.studentName.slice(0,1)}</span><div><strong>{ticket.studentName}</strong><small>{ticket.email}</small></div>{ticket.orderId && <div><small>Related order</small><strong>#{ticket.orderId.slice(0,8)}</strong></div>}<div><small>Created</small><strong>{new Date(ticket.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></div></div>
        <section className="support-thread admin-conversation">
          {ticket.messages.map((item) => (
            <article
              className={
                item.internal ? "support-message internal-note" : item.student ? "support-message student-message" : "support-message admin-message"
              }
              key={item.id}
            >
              <header><span className="avatar">{item.student ? ticket.studentName.slice(0,1) : "A"}</span><strong>{item.internal ? "Internal note" : item.student ? ticket.studentName : "Admin"}</strong><small>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></header>
              <p>{item.body}</p>
              {item.attachmentObjectKey && <a className="message-attachment" href={`/api/operations/support/messages/${item.id}/attachment`} target="_blank" rel="noreferrer">⌕ {item.attachmentFileName ?? "Open attachment"}</a>}
            </article>
          ))}
        </section>
        <ManagedTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} />
      </section>
    </WorkspaceShell>
  );
}
