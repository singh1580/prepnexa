import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentSupportTicket } from "@/features/operations/service";
import { SupportReplyForm } from "@/features/operations/ui/student-actions";
import { AppError } from "@/lib/errors/app-error";

export const metadata = { title: "Support ticket" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspace(); if (auth.admin) redirect("/admin");
  let ticket: Awaited<ReturnType<typeof getStudentSupportTicket>>;
  try { ticket = await getStudentSupportTicket((await params).id, auth.user.id); } catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  return <WorkspaceShell admin={false} name={auth.user.name} section="support"><Link className="back-link" href="/dashboard/support">← All support tickets</Link><header className="page-heading"><span className="eyebrow">{String(ticket.category)}</span><h1>{String(ticket.subject)}</h1><p>Created {new Date(ticket.createdAt as Date).toLocaleString("en-IN")} · <span className="status-pill">{String(ticket.status).replaceAll("_", " ")}</span></p></header><section className="support-thread">{ticket.messages.map((item) => <article className={item.mine ? "panel support-message mine" : "panel support-message"} key={item.id}><span className="eyebrow">{item.mine ? "YOU" : "PREPNEXA SUPPORT"}</span><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small></article>)}</section>{ticket.status === "CLOSED" ? <p className="notice">This ticket is closed.</p> : <section className="panel"><SupportReplyForm ticketId={String(ticket.id)} /></section>}</WorkspaceShell>;
}
