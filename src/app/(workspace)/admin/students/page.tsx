import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import {
  getManagedStudent,
  getManagedStudents,
} from "@/features/operations/service";
import { StudentStatusAction } from "@/features/operations/ui/admin-actions";
import { normaliseProductName } from "@/features/catalog/presentation";
import { UiIcon } from "@/components/ui-icon";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  adminCard,
  adminControl,
  adminDetailBackdrop,
  adminDetailHeader,
  adminDetailList,
  adminEmptyState,
  adminFilterForm,
  adminMiniRecord,
  adminPagination,
  adminResponsiveTable,
  adminSecondaryButton,
  adminStudentSideDetail,
  adminSideSection,
  adminStatusClass,
  adminStatusPill,
} from "@/components/admin-styles";

export const metadata = { title: "Students" };
type StudentQuery = {
  student?: string;
  q?: string;
  status?: string;
  page?: string;
  tab?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<StudentQuery>;
}) {
  const auth = await requireWorkspacePermission(
    OPERATIONS_PERMISSIONS.readStudents,
  );
  const query = await searchParams;
  const students = await getManagedStudents();
  const q = query.q?.trim().toLowerCase() ?? "";
  const status = query.status ?? "ALL";
  const filtered = students.filter(
    (student) =>
      (!q || `${student.name} ${student.email}`.toLowerCase().includes(q)) &&
      (status === "ALL" || student.status === status),
  );
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, Number(query.page) || 1), totalPages);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = query.student
    ? await getManagedStudent(query.student).catch(() => null)
    : null;
  const canManage = auth.permissions.includes(
    OPERATIONS_PERMISSIONS.manageStudents,
  );
  const tab = ["overview", "packages", "orders"].includes(query.tab ?? "")
    ? query.tab
    : "overview";
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

  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="students"
    >
      <AdminPageHeader
        title="Students"
        description="Manage student accounts, package access and order history."
      >
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-prep-control border border-prep-orange bg-prep-orange px-4 font-bold text-white hover:bg-prep-orange-dark"
          href="/api/operations/admin/students/export"
        >
          <UiIcon name="export" /> Export students
        </a>
      </AdminPageHeader>
      <form
        className={`${adminFilterForm} grid-cols-[minmax(15rem,1fr)_minmax(10rem,0.32fr)_auto_auto] max-[760px]:grid-cols-1`}
      >
        <label>
          <span className="sr-only">Search students</span>
          <input
            className={adminControl}
            name="q"
            defaultValue={query.q}
            type="search"
            placeholder="Search students by name or email…"
          />
        </label>
        <label>
          <span className="sr-only">Account status</span>
          <select className={adminControl} name="status" defaultValue={status}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending verification</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </label>
        <button className={adminSecondaryButton} type="submit">
          Apply filters
        </button>
        {(q || status !== "ALL") && (
          <Link
            className="inline-flex min-h-[2.65rem] items-center px-1 font-[750] whitespace-nowrap text-prep-orange-dark"
            href="/admin/students"
          >
            Clear
          </Link>
        )}
      </form>
      <section className={adminCard}>
        <div className="overflow-x-auto max-[800px]:overflow-visible">
          <table
            className={`${adminResponsiveTable} min-w-[850px] max-[700px]:min-w-0`}
          >
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Joined date</th>
                <th>Active packages</th>
                <th>Orders</th>
                <th>Account status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => (
                <tr
                  className={selected?.id === student.id ? "bg-[#fff2e9]" : ""}
                  key={student.id}
                >
                  <td data-label="Student">
                    <span className="flex items-center gap-[0.55rem]">
                      <i className="grid size-[1.8rem] place-items-center rounded-full bg-[#eef2fb] text-[0.6rem] font-normal not-italic text-[#46649a]">
                        {student.name.slice(0, 2).toUpperCase()}
                      </i>
                      <strong>{student.name}</strong>
                    </span>
                  </td>
                  <td data-label="Email">{student.email}</td>
                  <td data-label="Joined date">
                    {new Date(student.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td data-label="Active packages">{student.activePackages}</td>
                  <td data-label="Orders">{student.orderCount}</td>
                  <td data-label="Account status">
                    <span
                      className={`${adminStatusPill} ${adminStatusClass(student.status)}`}
                    >
                      ● {student.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <Link
                      className={adminSecondaryButton}
                      href={studentHref(student.id)}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className={adminEmptyState}>
            <strong>No students found</strong>
            <span>Try another search or account status.</span>
          </div>
        )}
        <footer className={adminPagination}>
          <span>
            Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}{" "}
            students
          </span>
          {totalPages > 1 ? (
            <nav aria-label="Student pages">
              <Link
                aria-disabled={page === 1}
                href={listHref(Math.max(1, page - 1))}
              >
                ‹
              </Link>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  (value) =>
                    value === 1 ||
                    value === totalPages ||
                    Math.abs(value - page) <= 1,
                )
                .map((value) => (
                  <Link
                    aria-current={value === page ? "page" : undefined}
                    href={listHref(value)}
                    key={value}
                  >
                    {value}
                  </Link>
                ))}
              <Link
                aria-disabled={page === totalPages}
                href={listHref(Math.min(totalPages, page + 1))}
              >
                ›
              </Link>
            </nav>
          ) : null}
        </footer>
      </section>
      {selected && (
        <>
          <Link
            className={adminDetailBackdrop}
            href={listHref(page)}
            aria-label="Close student details"
          />
          <section
            className={adminStudentSideDetail}
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-detail-title"
          >
            <header className={adminDetailHeader}>
              <div className="flex min-w-0 items-center gap-[0.7rem]">
                <span className="grid size-10 shrink-0 place-items-center rounded-[0.7rem] bg-[#eef2fb] text-xs font-extrabold text-[#46649a]">
                  {selected.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 id="student-detail-title" className="truncate">
                    {selected.name}
                  </h2>
                  <p className="my-0.5 truncate text-[0.72rem] text-prep-muted">
                    {selected.email}
                  </p>
                  <span
                    className={`${adminStatusPill} ${adminStatusClass(selected.status)}`}
                  >
                    ● {selected.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
              <Link
                className="grid size-[2.35rem] shrink-0 place-items-center rounded-[0.55rem] border border-[#dedbd7] bg-white text-[#535a60] hover:bg-[#f6f5f3] [&_svg]:size-5"
                href={listHref(page)}
                aria-label="Close student details"
              >
                <UiIcon name="close" />
              </Link>
            </header>
            <nav className="sticky top-[4.45rem] z-[3] grid grid-cols-3 border-b border-[#e5e3e0] bg-white px-4 max-[700px]:overflow-x-auto">
              <Link
                className={`border-b-2 px-2 py-3 text-center text-[0.7rem] font-bold whitespace-nowrap ${tab === "overview" ? "border-prep-orange text-prep-orange-dark" : "border-transparent"}`}
                href={studentHref(selected.id, "overview")}
              >
                Overview
              </Link>
              <Link
                className={`border-b-2 px-2 py-3 text-center text-[0.7rem] font-bold whitespace-nowrap ${tab === "packages" ? "border-prep-orange text-prep-orange-dark" : "border-transparent"}`}
                href={studentHref(selected.id, "packages")}
              >
                Packages
              </Link>
              <Link
                className={`border-b-2 px-2 py-3 text-center text-[0.7rem] font-bold whitespace-nowrap ${tab === "orders" ? "border-prep-orange text-prep-orange-dark" : "border-transparent"}`}
                href={studentHref(selected.id, "orders")}
              >
                Orders
              </Link>
            </nav>
            {tab === "overview" && (
              <>
                <div className="grid grid-cols-3 border-b border-prep-line bg-[#faf8f5] max-[700px]:grid-cols-1 [&>div]:grid [&>div]:gap-1 [&>div]:border-l [&>div]:border-prep-line [&>div]:px-[0.8rem] [&>div]:py-[0.7rem] [&>div:first-child]:border-l-0 max-[700px]:[&>div]:border-t max-[700px]:[&>div]:border-l-0 max-[700px]:[&>div:first-child]:border-t-0 [&_span]:text-[0.68rem] [&_span]:text-prep-muted [&_strong]:text-[0.8rem]">
                  <div>
                    <span>Joined date</span>
                    <strong>
                      {new Date(selected.createdAt).toLocaleDateString(
                        "en-IN",
                        { dateStyle: "medium" },
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Total orders</span>
                    <strong>{selected.orderCount}</strong>
                  </div>
                  <div>
                    <span>Active packages</span>
                    <strong>
                      {
                        selected.access.filter(
                          (item) => item.status === "ACTIVE",
                        ).length
                      }
                    </strong>
                  </div>
                </div>
                <div className={adminSideSection}>
                  <h3>Account details</h3>
                  <dl className={adminDetailList}>
                    <div>
                      <dt>Status</dt>
                      <dd>{selected.status.replaceAll("_", " ")}</dd>
                    </div>
                    <div>
                      <dt>Email verified</dt>
                      <dd>{selected.emailVerifiedAt ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt>Active devices</dt>
                      <dd>{selected.activeSessions}</dd>
                    </div>
                    <div>
                      <dt>Open tickets</dt>
                      <dd>{selected.openTickets}</dd>
                    </div>
                  </dl>
                </div>
                <RecordPreview
                  title="Package access"
                  viewAll={studentHref(selected.id, "packages")}
                  empty="No package access."
                >
                  {selected.access.slice(0, 2).map((item) => (
                    <article className={adminMiniRecord} key={item.id}>
                      <div>
                        <strong>{normaliseProductName(item.name)}</strong>
                        <small>
                          Expires{" "}
                          {new Date(item.expiresAt).toLocaleDateString("en-IN")}
                        </small>
                      </div>
                      <span
                        className={`${adminStatusPill} ${adminStatusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </article>
                  ))}
                </RecordPreview>
                <RecordPreview
                  title="Recent orders"
                  viewAll={studentHref(selected.id, "orders")}
                  empty="No orders."
                >
                  {selected.orders.slice(0, 2).map((order) => (
                    <OrderRecord key={order.id} order={order} />
                  ))}
                </RecordPreview>
                {canManage && (
                  <div className={adminSideSection}>
                    <h3>Account actions</h3>
                    <StudentStatusAction
                      id={selected.id}
                      status={selected.status}
                    />
                  </div>
                )}
              </>
            )}
            {tab === "packages" && (
              <div className={adminSideSection}>
                <h3>Package access</h3>
                {selected.access.length ? (
                  selected.access.map((item) => (
                    <article className={adminMiniRecord} key={item.id}>
                      <div>
                        <strong>{normaliseProductName(item.name)}</strong>
                        <small>
                          Access expires{" "}
                          {new Date(item.expiresAt).toLocaleDateString("en-IN")}
                        </small>
                      </div>
                      <span
                        className={`${adminStatusPill} ${adminStatusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-prep-muted">No package access.</p>
                )}
              </div>
            )}
            {tab === "orders" && (
              <div className={adminSideSection}>
                <h3>Recent orders</h3>
                {selected.orders.length ? (
                  selected.orders.map((order) => (
                    <OrderRecord key={order.id} order={order} />
                  ))
                ) : (
                  <p className="text-sm text-prep-muted">No orders.</p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </WorkspaceShell>
  );
}

function RecordPreview({
  title,
  viewAll,
  empty,
  children,
}: {
  title: string;
  viewAll: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div className={adminSideSection}>
      <div className="mb-[0.65rem] flex items-center justify-between gap-4">
        <h3>{title}</h3>
        <Link
          className="text-[0.7rem] font-bold text-prep-orange-dark"
          href={viewAll}
        >
          View all
        </Link>
      </div>
      {hasChildren ? (
        children
      ) : (
        <p className="text-sm text-prep-muted">{empty}</p>
      )}
    </div>
  );
}

function OrderRecord({
  order,
}: {
  order: { id: string; createdAt: Date; totalPaise: number; currency: string };
}) {
  return (
    <Link className={adminMiniRecord} href={`/admin/orders?order=${order.id}`}>
      <div>
        <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
        <small>{new Date(order.createdAt).toLocaleDateString("en-IN")}</small>
      </div>
      <b>{formatMoney(order.totalPaise, order.currency)}</b>
    </Link>
  );
}
