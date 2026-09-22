import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getCouponProducts, getManagedCoupon } from "@/features/commerce/service";
import { CouponForm, type CouponFormValue } from "@/features/commerce/ui/coupon-forms";
import { commerceIdSchema } from "@/features/commerce/validation";

export const metadata = { title: "Edit coupon" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspace(true);
  const id = commerceIdSchema.parse((await params).id);
  const [coupon, products] = await Promise.all([getManagedCoupon(id), getCouponProducts()]);
  return <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="coupons">
    <header className="page-heading"><span className="eyebrow">COMMERCE</span><h1>Edit {coupon.code}</h1><p>Update pricing rules, limits, schedule and eligible products.</p></header>
    <section className="panel admin-editor-panel"><CouponForm products={products} initial={coupon as CouponFormValue} /><Link className="text-button" href="/admin/coupons">Back to coupons</Link></section>
  </WorkspaceShell>;
}
