import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedStudent, getManagedStudents } from "@/features/operations/service";
import { StudentStatusAction } from "@/features/operations/ui/admin-actions";

export const metadata = { title: "Students" };
type StudentQuery = { student?: string; q?: string; status?: string; page?: string; tab?: string };

export default async function Page({ searchParams }: { searchParams: Promise<StudentQuery> }) {
  const auth = await requireWorkspacePermission(OPERATIONS_PERMISSIONS.readStudents);
  const query = await searchParams;
  const students = await getManagedStudents();
  const q = query.q?.trim().toLowerCase() ?? "";
  const status = query.status ?? "ALL";
  const filtered = students.filter((student) =>
    (!q || `${student.name} ${student.email}`.toLowerCase().includes(q)) &&
    (status === "ALL" || student.status === status));
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, Number(query.page) || 1), totalPages);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = query.student ? await getManagedStudent(query.student).catch(() => null) : null;
  const canManage = auth.permissions.includes(OPERATIONS_PERMISSIONS.manageStudents);
  const tab = ["overview", "packages", "orders"].includes(query.tab ?? "") ? query.tab : "overview";
  const listHref = (pageValue?: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (status !== "ALL") params.set("status", status);
    if (pageValue && pageValue > 1) params.set("page", String(pageValue));
    const suffix = params.toString();
    return `/admin/students${suffix ? `?${suffix}` : ""}`;
  };
  const studentHref = (studentId: string, tabValue = "overview") => {
    const params = new URLSearchParams();
    params.set("student", studentId);
    if (query.q) params.set("q", query.q);
    if (status !== "ALL") params.set("status", status);
    params.set("tab", tabValue);
    return `/admin/students?${params.toString()}`;
  };

  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="students">
    <header className="admin-page-header"><div><h1>Students</h1><p>Manage student accounts, package access and order history.</p></div><a className="button" href="/api/operations/admin/students/export">⇩ Export students</a></header>
    <form className="admin-list-controls student-list-controls">
      <label className="order-search-field"><span className="sr-only">Search students</span><input name="q" defaultValue={query.q} type="search" placeholder="Search students by name or email…"/></label>
      <label><span className="sr-only">Account status</span><select name="status" defaultValue={status}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="PENDING_VERIFICATION">Pending verification</option><option value="SUSPENDED">Suspended</option></select></label>
      <button className="button secondary" type="submit">Apply filters</button>
      {(q || status !== "ALL") && <Link className="text-button" href="/admin/students">Clear</Link>}
    </form>
    <section className="admin-card support-table-card reference-student-card">
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Student</th><th>Email</th><th>Joined date</th><th>Active packages</th><th>Orders</th><th>Account status</th><th>Action</th></tr></thead><tbody>{rows.map((student) => <tr className={selected?.id === student.id ? "selected-row" : ""} key={student.id}><td><span className="student-cell"><i>{student.name.slice(0, 2).toUpperCase()}</i><strong>{student.name}</strong></span></td><td>{student.email}</td><td>{new Date(student.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td><td>{student.activePackages}</td><td>{student.orderCount}</td><td><span className={`commerce-status status-${student.status.toLowerCase()}`}>● {student.status.replaceAll("_", " ")}</span></td><td><Link className="button secondary small" href={studentHref(student.id)}>View</Link></td></tr>)}</tbody></table></div>
      {!rows.length && <div className="clean-empty"><strong>No students found</strong><span>Try another search or account status.</span></div>}
      <footer className="table-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} students</span><nav aria-label="Student pages"><Link aria-disabled={page === 1} href={listHref(Math.max(1, page - 1))}>‹</Link>{Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1).map((value) => <Link className={value === page ? "active" : ""} href={listHref(value)} key={value}>{value}</Link>)}<Link aria-disabled={page === totalPages} href={listHref(Math.min(totalPages, page + 1))}>›</Link></nav></footer>
    </section>
    {selected && <><Link className="admin-detail-backdrop" href={listHref(page)} aria-label="Close student details"/><section className="admin-side-detail student-side-detail reference-order-detail">
      <header><div><span className="avatar">{selected.name.slice(0, 2).toUpperCase()}</span><div><h2>{selected.name}</h2><p>{selected.email}</p><span className={`commerce-status status-${selected.status.toLowerCase()}`}>● {selected.status.replaceAll("_", " ")}</span></div></div><Link className="icon-button" href={listHref(page)} aria-label="Close student details">×</Link></header>
      <nav className="side-detail-tabs"><Link className={tab === "overview" ? "active" : ""} href={studentHref(selected.id, "overview")}>Overview</Link><Link className={tab === "packages" ? "active" : ""} href={studentHref(selected.id, "packages")}>Packages</Link><Link className={tab === "orders" ? "active" : ""} href={studentHref(selected.id, "orders")}>Orders</Link></nav>
      {tab === "overview" && <><div className="side-detail-metrics"><div><span>Joined date</span><strong>{new Date(selected.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong></div><div><span>Total orders</span><strong>{selected.orderCount}</strong></div><div><span>Active packages</span><strong>{selected.access.filter((item) => item.status === "ACTIVE").length}</strong></div></div><div className="side-detail-section"><h3>Account details</h3><dl className="detail-list"><div><dt>Status</dt><dd>{selected.status.replaceAll("_", " ")}</dd></div><div><dt>Email verified</dt><dd>{selected.emailVerifiedAt ? "Yes" : "No"}</dd></div><div><dt>Active devices</dt><dd>{selected.activeSessions}</dd></div><div><dt>Open tickets</dt><dd>{selected.openTickets}</dd></div></dl></div><RecordPreview title="Package access" viewAll={studentHref(selected.id, "packages")} empty="No package access.">{selected.access.slice(0, 2).map((item) => <article className="mini-record" key={item.id}><div><strong>{item.name}</strong><small>Expires {new Date(item.expiresAt).toLocaleDateString("en-IN")}</small></div><span className={`commerce-status status-${item.status.toLowerCase()}`}>{item.status}</span></article>)}</RecordPreview><RecordPreview title="Recent orders" viewAll={studentHref(selected.id, "orders")} empty="No orders.">{selected.orders.slice(0, 2).map((order) => <OrderRecord key={order.id} order={order}/>)}</RecordPreview>{canManage && <div className="side-detail-section account-actions"><h3>Account actions</h3><StudentStatusAction id={selected.id} status={selected.status}/></div>}</>}
      {tab === "packages" && <div className="side-detail-section"><h3>Package access</h3>{selected.access.length ? selected.access.map((item) => <article className="mini-record" key={item.id}><div><strong>{item.name}</strong><small>Access expires {new Date(item.expiresAt).toLocaleDateString("en-IN")}</small></div><span className={`commerce-status status-${item.status.toLowerCase()}`}>{item.status}</span></article>) : <p className="muted">No package access.</p>}</div>}
      {tab === "orders" && <div className="side-detail-section"><h3>Recent orders</h3>{selected.orders.length ? selected.orders.map((order) => <OrderRecord key={order.id} order={order}/>) : <p className="muted">No orders.</p>}</div>}
    </section></>}
  </WorkspaceShell>;
}

function RecordPreview({ title, viewAll, empty, children }: { title: string; viewAll: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="side-detail-section"><div className="side-section-heading"><h3>{title}</h3><Link href={viewAll}>View all</Link></div>{hasChildren ? children : <p className="muted">{empty}</p>}</div>;
}

function OrderRecord({ order }: { order: { id: string; createdAt: Date; totalPaise: number; currency: string } }) {
  return <Link className="mini-record" href={`/admin/orders?order=${order.id}`}><div><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><small>{new Date(order.createdAt).toLocaleDateString("en-IN")}</small></div><b>{formatMoney(order.totalPaise, order.currency)}</b></Link>;
}
