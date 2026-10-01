import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { requireWorkspacePermission } from "@/features/auth/page-access";
import { OPERATIONS_PERMISSIONS } from "@/features/operations/permissions";
import { getManagedNotificationDeliveries, getNotificationCampaignOptions, getNotificationCampaigns } from "@/features/operations/service";
import { NotificationCampaignForm, RetryDeliveryButton } from "@/features/operations/ui/admin-actions";

export const metadata = { title: "Notifications" };
const audienceLabel = (audience: string, product: string | null) => audience === "PACKAGE_CUSTOMERS" ? `${product ?? "Package"} customers` : audience === "INACTIVE_STUDENTS" ? "Inactive students" : "All students";

export default async function Page() {
  const auth = await requireWorkspacePermission(OPERATIONS_PERMISSIONS.manageNotifications);
  const [campaigns, products, deliveries] = await Promise.all([getNotificationCampaigns(), getNotificationCampaignOptions(), getManagedNotificationDeliveries()]);
  const failed = deliveries.filter((item) => item.status !== "SENT");
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="notifications">
    <header className="admin-page-header"><div><p className="admin-kicker">COMMUNICATIONS</p><h1>Notifications</h1><p>Send announcements to students and review notification delivery.</p></div><AdminModal label="Send notification" title="Send Notification"><NotificationCampaignForm products={products} /></AdminModal></header>
    <section className="admin-card notification-campaigns-card">
      <div className="list-filter-bar"><label><span className="sr-only">Search notifications</span><input type="search" placeholder="Search notifications…" /></label><span>{campaigns.length} sent</span></div>
      {campaigns.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Audience</th><th>Title</th><th>Channel</th><th>Recipients</th><th>Sent date</th></tr></thead><tbody>{campaigns.map((item) => <tr key={item.id}><td>{audienceLabel(item.audience, item.productName)}</td><td><strong>{item.title}</strong><small>{item.body}</small></td><td><span className="status-pill">{item.channel === "IN_APP" ? "In-app" : "Email"}</span></td><td>{item.recipientCount}</td><td>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td></tr>)}</tbody></table></div> : <div className="clean-empty"><strong>No notifications sent</strong><span>Use Send notification to contact students.</span></div>}
    </section>
    {failed.length > 0 && <section className="admin-card failed-deliveries"><div className="card-heading"><div><span className="eyebrow">NEEDS ATTENTION</span><h2>Email delivery issues</h2></div></div>{failed.slice(0, 12).map((item) => <article key={item.id}><div><strong>{item.title}</strong><small>{item.name} · {item.email}{item.lastError ? ` · ${item.lastError}` : ""}</small></div><span className={`status-pill content-${item.status.toLowerCase()}`}>{item.status}</span><RetryDeliveryButton id={item.id} /></article>)}</section>}
  </WorkspaceShell>;
}
