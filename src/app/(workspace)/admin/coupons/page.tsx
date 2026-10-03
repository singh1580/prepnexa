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
    const summary = row as { id: string; code: string; type: string; value: number; active: boolean; usedCount: number; totalLimit: number | null; productCount: number; minOrderPaise:number;endsAt:Date|null };
    return { summary, detail: await getManagedCoupon(summary.id) };
  }));
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="coupons">
      <header className="admin-page-header"><div><h1>Coupons</h1><p>Create and manage discount coupons for your products.</p></div><AdminModal label="＋ New coupon" title="Create coupon" description="Set a simple discount, validity and usage limit."><CouponForm products={products} /></AdminModal></header>
      <section className="admin-card flush-card reference-coupon-card"><div className="admin-table-wrap"><table className="admin-table coupon-table"><thead><tr><th>Code</th><th>Discount</th><th>Min. order</th><th>Usage</th><th>Valid until</th><th>Active</th><th>Actions</th></tr></thead><tbody>{coupons.map(({ summary, detail }) => <tr key={summary.id}><td><strong>{summary.code}</strong></td><td>{summary.type === "PERCENT" ? `${summary.value / 100}% OFF` : `₹${(summary.value / 100).toLocaleString("en-IN")} OFF`}</td><td>₹{(summary.minOrderPaise/100).toLocaleString("en-IN")}</td><td>{summary.usedCount} / {summary.totalLimit ?? "∞"}</td><td>{summary.endsAt?new Date(summary.endsAt).toLocaleDateString("en-IN"):`No expiry`}</td><td><CouponStatusButton id={summary.id} active={summary.active}/></td><td><AdminModal secondary label="Edit" title={`Edit ${summary.code}`} description="Update discount, validity and package scope."><CouponForm products={products} initial={detail as CouponFormValue}/></AdminModal></td></tr>)}</tbody></table></div>{!coupons.length && <div className="clean-empty tall"><strong>No coupons yet</strong><span>Create a coupon when you are ready to run an offer.</span></div>}</section>
    </WorkspaceShell>
  );
}
