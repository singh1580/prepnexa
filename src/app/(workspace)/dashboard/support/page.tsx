import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentOrders } from "@/features/commerce/service";
import { getStudentSupportTickets } from "@/features/operations/service";
import { NewSupportTicketForm } from "@/features/operations/ui/student-actions";

export const metadata = { title: "Support" };
export default async function Page() {
  const auth = await requireWorkspace(); if (auth.admin) redirect("/admin");
  const [tickets, orders] = await Promise.all([getStudentSupportTickets(auth.user.id), getStudentOrders(auth.user.id)]);
  const orderOptions = orders.map((order) => { const value = order as { id: string; createdAt: Date; items: { name: string }[] }; return { id: value.id, label: `${value.items.map((item) => item.name).join(", ")} · ${new Date(value.createdAt).toLocaleDateString("en-IN")}` }; });
  return <WorkspaceShell admin={false} name={auth.user.name} section="support"><header className="page-heading"><span className="eyebrow">HELP CENTRE</span><h1>Support</h1><p>Create a ticket and keep every reply in one secure conversation.</p></header><div className="admin-two-column"><section><div className="section-heading"><div><span className="eyebrow">YOUR TICKETS</span><h2>Previous requests</h2></div></div>{tickets.length ? <div className="managed-list">{tickets.map((ticket) => <Link className="managed-card support-ticket-card" href={`/dashboard/support/${ticket.id}`} key={ticket.id}><div><span className="eyebrow">{ticket.category}</span><h2>{ticket.subject}</h2><p>Updated {new Date(ticket.updatedAt).toLocaleString("en-IN")}</p></div><span className={`status-pill content-${ticket.status.toLowerCase()}`}>{ticket.status.replaceAll("_", " ")}</span><b>{ticket.messageCount}</b></Link>)}</div> : <section className="panel compact-empty"><h2>No support tickets</h2><p className="muted">Your new request will appear here.</p></section>}</section><aside className="panel sticky-panel"><span className="eyebrow">NEW REQUEST</span><h2>How can we help?</h2><NewSupportTicketForm orders={orderOptions} /></aside></div></WorkspaceShell>;
}
