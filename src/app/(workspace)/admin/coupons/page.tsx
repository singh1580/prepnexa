import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { requireWorkspace } from "@/features/auth/page-access";
import { getCouponProducts, getManagedCoupon, getManagedCoupons } from "@/features/commerce/service";
import { CouponForm, CouponStatusButton, type CouponFormValue } from "@/features/commerce/ui/coupon-forms";

export const metadata = { title: "Coupons" };
export default async function Page() {
  const auth = await requireWorkspace(true);
  const [rows, products] = await Promise.all([getManagedCoupons(), getCouponProducts()]);
  const coupons = await Promise.all(rows.map(async (row) => {
    const summary = row as { id: string; code: string; type: string; value: number; active: boolean; usedCount: number; totalLimit: number | null; productCount: number };
    return { summary, detail: await getManagedCoupon(summary.id) };
  }));
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="coupons">
      <header className="admin-page-header"><div><p className="admin-kicker">DISCOUNTS</p><h1>Coupons</h1><p>Create and manage simple offers for your product packages.</p></div><AdminModal label="+ New coupon" title="New coupon" description="Set the discount, usage and optional package scope."><CouponForm products={products} /></AdminModal></header>
      <section className="admin-card flush-card"><div className="admin-table-wrap"><table className="admin-table coupon-table"><thead><tr><th>Coupon</th><th>Discount</th><th>Usage</th><th>Products</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{coupons.map(({ summary, detail }) => <tr key={summary.id}><td><strong>{summary.code}</strong></td><td>{summary.type === "PERCENT" ? `${summary.value / 100}%` : `₹${(summary.value / 100).toLocaleString("en-IN")}`}</td><td>{summary.usedCount} / {summary.totalLimit ?? "∞"}</td><td>{summary.productCount || "All live"}</td><td><span className={summary.active ? "commerce-status status-paid" : "commerce-status"}>{summary.active ? "Active" : "Disabled"}</span></td><td><div className="row-actions"><AdminModal secondary label="Edit" title={`Edit ${summary.code}`} description="Update the discount and package scope."><CouponForm products={products} initial={detail as CouponFormValue} /></AdminModal><CouponStatusButton id={summary.id} active={summary.active} /></div></td></tr>)}</tbody></table></div>{!coupons.length && <div className="clean-empty tall"><strong>No coupons yet</strong><span>Create a coupon when you are ready to run an offer.</span></div>}</section>
    </WorkspaceShell>
  );
}
