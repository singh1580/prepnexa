import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { getAdminDashboard } from "@/features/operations/admin-dashboard";

export const metadata = { title: "Admin dashboard" };
export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const requested = Number((await searchParams).days ?? 14);
  const auth = await requireWorkspace(true);
  const data = await getAdminDashboard(requested);
  const max = Math.max(1, ...data.revenue.map((item) => item.revenuePaise));
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="overview">
      <header className="admin-page-header"><div><p className="admin-kicker">BUSINESS OVERVIEW</p><h1>Dashboard</h1><p>Revenue, orders, users and product performance in one place.</p></div><form className="period-selector"><label><span>Period</span><select name="days" defaultValue={data.days}>{[7, 14, 30, 90].map((days) => <option key={days} value={days}>Last {days} days</option>)}</select></label><button className="button secondary small" type="submit">Update</button></form></header>
      <section className="dashboard-metrics"><article><span>Revenue</span><strong>{formatMoney(data.summary.revenuePaise, "INR")}</strong><small>Verified paid orders</small></article><article><span>Orders</span><strong>{data.summary.orders}</strong><small>All order records</small></article><article><span>Users</span><strong>{data.summary.users}</strong><small>Registered students</small></article><article><span>Products</span><strong>{data.summary.products}</strong><small>{data.summary.liveProducts} live</small></article></section>
      <div className="dashboard-grid"><section className="admin-card chart-card"><div className="card-heading"><div><p className="admin-kicker">REVENUE</p><h2>{data.days}-day performance</h2></div></div><div className="mini-chart">{data.revenue.map((item) => <div key={String(item.day)} title={formatMoney(item.revenuePaise, "INR")}><span style={{ height: `${Math.max(3, item.revenuePaise / max * 100)}%` }} /><small>{new Date(item.day).toLocaleDateString("en-IN", { day: "2-digit" })}</small></div>)}</div></section><section className="admin-card"><div className="card-heading"><div><p className="admin-kicker">TOP PRODUCTS</p><h2>Best sellers</h2></div><Link href="/admin/packages">View products</Link></div>{data.topProducts.length ? <ol className="top-products">{data.topProducts.map((product) => <li key={product.id}><span>{product.name}<small>{product.sold} sold</small></span><strong>{formatMoney(product.revenuePaise, "INR")}</strong></li>)}</ol> : <p className="muted">Sales will appear here.</p>}</section></div>
      <section className="admin-card flush-card"><div className="card-heading"><div><p className="admin-kicker">RECENT ORDERS</p><h2>Latest transactions</h2></div><Link href="/admin/orders">View all</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Status</th><th>Date</th><th className="align-right">Total</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id}><td><strong>{order.name}</strong><small>{order.email}</small></td><td><span className={`commerce-status status-${order.status.toLowerCase()}`}>{order.status}</span></td><td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td><td className="align-right">{formatMoney(order.totalPaise, "INR")}</td></tr>)}</tbody></table></div>{!data.recentOrders.length && <div className="clean-empty"><strong>No orders yet</strong><span>New transactions will appear here.</span></div>}</section>
    </WorkspaceShell>
  );
}
