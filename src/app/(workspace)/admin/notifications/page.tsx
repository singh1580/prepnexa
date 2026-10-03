import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { AdminModal } from "@/components/admin-modal";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import {
  getManagedNotificationDeliveries,
  getNotificationCampaignOptions,
  getNotificationCampaigns,
} from "@/features/operations/service";
import {
  NotificationCampaignForm,
  RetryDeliveryButton,
} from "@/features/operations/ui/admin-actions";

export const metadata = { title: "Notifications" };
const audienceLabel = (audience: string, product: string | null) =>
  audience === "PACKAGE_CUSTOMERS"
    ? `${product ?? "Package"} customers`
    : audience === "INACTIVE_STUDENTS"
      ? "Inactive students"
      : "All students";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; audience?: string; page?: string }>;
}) {
  const auth = await requireWorkspacePermission(
    OPERATIONS_PERMISSIONS.manageNotifications,
  );
  const [campaigns, products, deliveries] = await Promise.all([
    getNotificationCampaigns(),
    getNotificationCampaignOptions(),
    getManagedNotificationDeliveries(),
  ]);
  const query = await searchParams;
  const q = query.q?.trim().toLowerCase() ?? "";
  const audience = query.audience ?? "ALL";
  const visible = campaigns.filter(
    (item) =>
      (!q ||
        `${item.title} ${item.body} ${item.productName ?? ""}`
          .toLowerCase()
          .includes(q)) &&
      (audience === "ALL" || item.audience === audience),
  );
  const failed = deliveries.filter((item) => item.status !== "SENT");
  const pageSize = 10;
  const page = Math.max(1, Number(query.page) || 1);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageHref = (value: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (audience !== "ALL") params.set("audience", audience);
    if (value > 1) params.set("page", String(value));
    const suffix = params.toString();
    return `/admin/notifications${suffix ? `?${suffix}` : ""}`;
  };
  return (
    <WorkspaceShell
      admin
      name={auth.user.name}
      permissions={auth.permissions}
      section="notifications"
    >
      <header className="admin-page-header">
        <div>
          <h1>Notifications</h1>
          <p>
            Send announcements to students and review notification delivery.
          </p>
        </div>
        <AdminModal label="✉ Send notification" title="Send Notification">
          <NotificationCampaignForm products={products} />
        </AdminModal>
      </header>
      <section className="admin-card notification-campaigns-card">
        <form className="list-filter-bar notification-filters">
          <label>
            <span>Search</span>
            <input
              name="q"
              defaultValue={query.q}
              type="search"
              placeholder="Search notifications…"
            />
          </label>
          <label>
            <span>Audience</span>
            <select name="audience" defaultValue={audience}>
              <option value="ALL">All audiences</option>
              <option value="ALL_STUDENTS">All students</option>
              <option value="PACKAGE_CUSTOMERS">Package customers</option>
              <option value="INACTIVE_STUDENTS">Inactive students</option>
            </select>
          </label>
          <button className="button secondary small">Apply filters</button>
          <span>{visible.length} notification{visible.length === 1 ? "" : "s"}</span>
        </form>
        {visible.length ? (
          <>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Audience</th>
                  <th>Title</th>
                  <th>Channel</th>
                  <th>Recipients</th>
                  <th>Sent date</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>{audienceLabel(item.audience, item.productName)}</td>
                    <td>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </td>
                    <td>
                      <span className="status-pill">
                        {item.channel === "IN_APP" ? "In-app" : "Email"}
                      </span>
                    </td>
                    <td>{item.recipientCount}</td>
                    <td>
                      {new Date(item.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>
                      <details className="table-row-menu">
                        <summary aria-label={`View details for ${item.title}`}>⋮</summary>
                        <div className="notification-row-detail">
                          <strong>{item.title}</strong>
                          <p>{item.body}</p>
                          <small>{audienceLabel(item.audience, item.productName)} · {item.recipientCount} recipients</small>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            <footer className="table-pagination">
              <span>Showing {visible.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, visible.length)} of {visible.length}</span>
              <nav aria-label="Notification pages">
                <Link aria-disabled={currentPage === 1} href={pageHref(Math.max(1, currentPage - 1))}>‹</Link>
                {Array.from({length: totalPages}, (_, index) => index + 1).filter(value => value === 1 || value === totalPages || Math.abs(value - currentPage) <= 1).map(value => <Link className={value === currentPage ? "active" : ""} href={pageHref(value)} key={value}>{value}</Link>)}
                <Link aria-disabled={currentPage === totalPages} href={pageHref(Math.min(totalPages, currentPage + 1))}>›</Link>
              </nav>
            </footer>
          </>
        ) : (
          <div className="clean-empty">
            <strong>No notifications found</strong>
            <span>Send a notification or change the filters.</span>
          </div>
        )}
      </section>
      {failed.length > 0 && (
        <section className="admin-card failed-deliveries">
          <div className="card-heading">
            <div>
              <span className="eyebrow">NEEDS ATTENTION</span>
              <h2>Email delivery issues</h2>
            </div>
          </div>
          {failed.slice(0, 12).map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <small>
                  {item.name} · {item.email}
                  {item.lastError ? ` · ${item.lastError}` : ""}
                </small>
              </div>
              <span
                className={`status-pill content-${item.status.toLowerCase()}`}
              >
                {item.status}
              </span>
              <RetryDeliveryButton id={item.id} />
            </article>
          ))}
        </section>
      )}
    </WorkspaceShell>
  );
}
