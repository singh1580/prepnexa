import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentSupportTicket } from "@/features/operations/service";
import { SupportReplyForm, SupportResolveButton } from "@/features/operations/ui/student-actions";
import { AppError } from "@/lib/errors/app-error";

export const metadata = { title: "Support ticket" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  let ticket: Awaited<ReturnType<typeof getStudentSupportTicket>>;
  try {
    ticket = await getStudentSupportTicket((await params).id, auth.user.id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  return (
    <WorkspaceShell admin={false} name={auth.user.name} section="support">
      <nav className="student-breadcrumb"><Link href="/dashboard">Dashboard</Link><span>›</span><Link href="/dashboard/support">Support</Link><span>›</span><b>Ticket #{String(ticket.id).slice(0,8).toUpperCase()}</b></nav>
      <Link className="back-link" href="/dashboard/support">← Back to Support</Link>
      <section className="reference-ticket"><header><div className="ticket-title-block"><div><h1>Ticket #{String(ticket.id).slice(0,8).toUpperCase()}</h1><span className={`support-status ${String(ticket.status).toLowerCase()}`}>● {String(ticket.status).replaceAll("_", " ")}</span></div><p>Created on {new Date(ticket.createdAt as Date).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})} &nbsp;·&nbsp; Related to: {String(ticket.subject)}</p></div><div className="ticket-header-actions">{!['RESOLVED','CLOSED'].includes(String(ticket.status))?<SupportResolveButton ticketId={String(ticket.id)}/>:null}<details className="ticket-more"><summary aria-label="Ticket details">⋮</summary><div><strong>{String(ticket.subject)}</strong><span>{String(ticket.category).replaceAll("_"," ")}</span></div></details></div></header>
      <div className="support-thread">
        {ticket.messages.map((item) => (
          <article
            className={
              item.mine ? "support-message customer" : "support-message support"
            }
            key={item.id}
          >
            <i className="thread-avatar">{item.mine?auth.user.name.slice(0,2).toUpperCase():"PS"}</i><div><header><strong>{item.mine?auth.user.name:"Prepstore Support"}</strong><small>{new Date(item.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></header><p>{item.body}</p>{item.attachmentObjectKey && <a className="message-attachment" href={`/api/operations/support/messages/${item.id}/attachment`} target="_blank" rel="noreferrer">▧ <span>{item.attachmentFileName ?? "Open attachment"}</span></a>}</div>
          </article>
        ))}
      </div>
      {ticket.status === "CLOSED" || ticket.status === "RESOLVED" ? (
        <p className="ticket-closed-note">This ticket is {String(ticket.status).toLowerCase()}. Create a new ticket if you need more help.</p>
      ) : (
        <section className="ticket-reply-box">
          <SupportReplyForm ticketId={String(ticket.id)} />
        </section>
      )}
      </section>
    </WorkspaceShell>
  );
}
