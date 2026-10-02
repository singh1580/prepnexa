import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentSupportTicket } from "@/features/operations/service";
import { SupportReplyForm } from "@/features/operations/ui/student-actions";
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
      <nav className="student-breadcrumb"><Link href="/dashboard/courses">My Packages</Link><span>›</span><Link href="/dashboard/support">Support</Link><span>›</span><b>Ticket #{String(ticket.id).slice(0,8).toUpperCase()}</b></nav>
      <Link className="back-link" href="/dashboard/support">← Back to Support</Link>
      <section className="reference-ticket"><header><div><h1>{String(ticket.subject)}</h1><p>Created on {new Date(ticket.createdAt as Date).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})} &nbsp;·&nbsp; Related to: {String(ticket.category).replaceAll("_"," ")}</p></div><span className={`support-status ${String(ticket.status).toLowerCase()}`}>● {String(ticket.status).replaceAll("_", " ")}</span></header>
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
      {ticket.status === "CLOSED" ? (
        <p className="notice">This ticket is closed.</p>
      ) : (
        <section className="ticket-reply-box">
          <SupportReplyForm ticketId={String(ticket.id)} />
        </section>
      )}
      </section>
    </WorkspaceShell>
  );
}
