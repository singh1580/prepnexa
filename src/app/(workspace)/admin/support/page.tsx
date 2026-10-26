import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedSupportTickets } from "@/features/operations/service";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  adminCard,
  adminEmptyState,
  adminResponsiveTable,
} from "@/components/admin-styles";

const tabClass = (active: boolean) =>
  `flex items-center gap-2 border-b-2 px-1 py-3 text-[0.75rem] font-bold whitespace-nowrap [&_b]:grid [&_b]:h-5 [&_b]:min-w-5 [&_b]:place-items-center [&_b]:rounded-full [&_b]:px-1.5 [&_b]:text-[0.62rem] ${
    active
      ? "border-prep-orange text-prep-orange-dark [&_b]:bg-prep-orange [&_b]:text-white"
      : "border-transparent text-prep-muted [&_b]:bg-[#ecebea]"
  }`;
const statusClass = (status: string) =>
  status === "RESOLVED"
    ? "border-[#bfe2cc] bg-[#e7f4ec] text-[#276448]"
    : status === "CLOSED"
      ? "border-[#d9dce0] bg-[#f0f1f2] text-[#5f666d]"
      : "border-[#f1d79b] bg-[#fff4d9] text-[#8a5b13]";

export const metadata = { title: "Support" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const auth = await requireWorkspacePermission(
    OPERATIONS_PERMISSIONS.manageSupport,
  );
  const query = await searchParams;
  const tickets = await getManagedSupportTickets();
  const q = query.q?.trim().toLowerCase() ?? "";
  const status = query.status ?? "ALL";
  const visible = tickets.filter(
    (ticket) =>
      (!q ||
        `${ticket.subject} ${ticket.studentName} ${ticket.email}`
          .toLowerCase()
          .includes(q)) &&
      (status === "ALL" || ticket.status === status),
  );
  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((ticket) => ticket.status === "OPEN").length,
    IN_PROGRESS: tickets.filter(
      (ticket) =>
        ticket.status === "IN_PROGRESS" ||
        ticket.status === "WAITING_FOR_STUDENT",
    ).length,
    RESOLVED: tickets.filter(
      (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
    ).length,
  };
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      email={auth.user.email}
      permissions={auth.permissions}
      section="support"
    >
      <AdminPageHeader
        title="Support"
        description="Manage student support tickets and respond to enquiries."
      >
        <form className="flex gap-2 max-[600px]:w-full">
          <input
            className="h-11 min-w-64 rounded-prep-control border border-prep-line bg-white px-3 max-[600px]:min-w-0 max-[600px]:flex-1"
            name="q"
            defaultValue={query.q}
            placeholder="Search tickets…"
          />
          <button className="inline-flex min-h-11 items-center justify-center rounded-prep-control border border-prep-orange bg-white px-4 font-bold text-prep-orange-dark">
            Filters
          </button>
        </form>
      </AdminPageHeader>
      <nav
        className="flex gap-6 overflow-x-auto border-b border-prep-line"
        aria-label="Ticket status"
      >
        <Link className={tabClass(status === "ALL")} href="/admin/support">
          All tickets <b>{counts.ALL}</b>
        </Link>
        <Link
          className={tabClass(status === "OPEN")}
          href="/admin/support?status=OPEN"
        >
          Open <b>{counts.OPEN}</b>
        </Link>
        <Link
          className={tabClass(status === "IN_PROGRESS")}
          href="/admin/support?status=IN_PROGRESS"
        >
          In progress <b>{counts.IN_PROGRESS}</b>
        </Link>
        <Link
          className={tabClass(status === "RESOLVED")}
          href="/admin/support?status=RESOLVED"
        >
          Resolved <b>{counts.RESOLVED}</b>
        </Link>
      </nav>
      <div className="mt-3 grid min-w-0 gap-3">
        {visible.length ? (
          <section className={adminCard}>
            <div className="overflow-x-auto max-[800px]:overflow-visible">
              <table
                className={`${adminResponsiveTable} min-w-[880px] max-[700px]:min-w-0`}
              >
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Student</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((ticket) => (
                    <tr key={ticket.id}>
                      <td data-label="Subject">
                        <Link href={`/admin/support/${ticket.id}`}>
                          <strong>{ticket.subject}</strong>
                          <small>#{ticket.id.slice(0, 6).toUpperCase()}</small>
                        </Link>
                      </td>
                      <td data-label="Category">
                        {ticket.category.replaceAll("_", " ")}
                      </td>
                      <td data-label="Student">
                        <strong>{ticket.studentName}</strong>
                        <small>{ticket.email}</small>
                      </td>
                      <td data-label="Order">
                        {ticket.orderId ? (
                          <Link href={`/admin/orders?order=${ticket.orderId}`}>
                            <strong>
                              #{ticket.orderId.slice(0, 8).toUpperCase()}
                            </strong>
                          </Link>
                        ) : (
                          <span aria-label="No related order">—</span>
                        )}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[0.68rem] font-bold whitespace-nowrap ${statusClass(ticket.status)}`}
                        >
                          {ticket.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td data-label="Updated">
                        {new Date(ticket.updatedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td data-label="Actions">
                        <Link
                          className="font-bold text-prep-orange-dark hover:underline"
                          href={`/admin/support/${ticket.id}`}
                          aria-label={`View ticket: ${ticket.subject}`}
                        >
                          View ticket
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className={adminEmptyState}>
            <h2>No matching tickets</h2>
            <p>Try another search or ticket status.</p>
          </section>
        )}
      </div>
    </WorkspaceShell>
  );
}
