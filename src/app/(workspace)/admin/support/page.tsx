import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedSupportTickets } from "@/features/operations/service";

export const metadata = { title: "Support" };
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const auth = await requireWorkspacePermission(OPERATIONS_PERMISSIONS.manageSupport);
  const query = await searchParams; const tickets = await getManagedSupportTickets(); const q = query.q?.trim().toLowerCase() ?? ""; const status = query.status ?? "ALL";
  const visible = tickets.filter((ticket) => (!q || `${ticket.subject} ${ticket.studentName} ${ticket.email}`.toLowerCase().includes(q)) && (status === "ALL" || ticket.status === status));
  const counts = { ALL: tickets.length, OPEN: tickets.filter((ticket) => ticket.status === "OPEN").length, IN_PROGRESS: tickets.filter((ticket) => ticket.status === "IN_PROGRESS" || ticket.status === "WAITING_FOR_STUDENT").length, RESOLVED: tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length };
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="support">
    <header className="admin-page-header"><div><p className="admin-kicker">STUDENT SUPPORT</p><h1>Support</h1><p>Manage student support tickets and respond to enquiries.</p></div><form className="support-search"><input name="q" defaultValue={query.q} placeholder="Search tickets…" /><button className="button secondary small">Search</button></form></header>
    <nav className="support-tabs" aria-label="Ticket status"><Link className={status === "ALL" ? "active" : ""} href="/admin/support">All tickets <b>{counts.ALL}</b></Link><Link className={status === "OPEN" ? "active" : ""} href="/admin/support?status=OPEN">Open <b>{counts.OPEN}</b></Link><Link className={status === "IN_PROGRESS" ? "active" : ""} href="/admin/support?status=IN_PROGRESS">In progress <b>{counts.IN_PROGRESS}</b></Link><Link className={status === "RESOLVED" ? "active" : ""} href="/admin/support?status=RESOLVED">Resolved <b>{counts.RESOLVED}</b></Link></nav>
    {visible.length ? <section className="admin-card support-table-card"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Subject</th><th>Category</th><th>Student</th><th>Status</th><th>Priority</th><th>Updated</th></tr></thead><tbody>{visible.map((ticket) => <tr key={ticket.id}><td><Link href={`/admin/support/${ticket.id}`}><strong>{ticket.subject}</strong></Link></td><td>{ticket.category.replaceAll("_", " ")}</td><td><strong>{ticket.studentName}</strong><small>{ticket.email}</small></td><td><span className={`status-pill content-${ticket.status.toLowerCase()}`}>{ticket.status.replaceAll("_", " ")}</span></td><td>{ticket.priority}</td><td><Link className="table-open-link" href={`/admin/support/${ticket.id}`}>{new Date(ticket.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} →</Link></td></tr>)}</tbody></table></div></section> : <section className="panel empty-state"><h2>No matching tickets</h2><p>Try another search or ticket status.</p></section>}
  </WorkspaceShell>;
}
