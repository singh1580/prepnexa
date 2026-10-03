import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { AdminModal } from "@/components/admin-modal";
import { requireWorkspace } from "@/features/auth/page-access";
import { getCouponProducts, getManagedCoupon, getManagedCoupons } from "@/features/commerce/service";
import { CouponForm, CouponStatusButton, type CouponFormValue } from "@/features/commerce/ui/coupon-forms";

export const metadata = { title: "Coupons" };
type CouponSummary={id:string;code:string;type:string;value:number;active:boolean;usedCount:number;totalLimit:number|null;productCount:number;minOrderPaise:number;endsAt:Date|null};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string;status?:string;page?:string}>}) {
  const auth = await requireWorkspace(true);
  const query=await searchParams;
  const [rawRows, products] = await Promise.all([getManagedCoupons(), getCouponProducts()]);
  const rows=rawRows as CouponSummary[];
  const q=query.q?.trim().toLowerCase()??"";
  const status=query.status??"ALL";
  const filtered=rows.filter((row)=>(!q||row.code.toLowerCase().includes(q))&&(status==="ALL"||(status==="ACTIVE"?row.active:!row.active)));
  const pageSize=10,totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),page=Math.min(Math.max(1,Number(query.page)||1),totalPages);
  const visible=filtered.slice((page-1)*pageSize,page*pageSize);
  const coupons = await Promise.all(visible.map(async (row) => {
    const summary = row as { id: string; code: string; type: string; value: number; active: boolean; usedCount: number; totalLimit: number | null; productCount: number; minOrderPaise:number;endsAt:Date|null };
    return { summary, detail: await getManagedCoupon(summary.id) };
  }));
  const pageHref=(value:number)=>{const params=new URLSearchParams();if(query.q)params.set("q",query.q);if(status!=="ALL")params.set("status",status);if(value>1)params.set("page",String(value));const suffix=params.toString();return `/admin/coupons${suffix?`?${suffix}`:""}`};
  return (
    <WorkspaceShell admin name={auth.user.name} permissions={auth.permissions} section="coupons">
      <header className="admin-page-header"><div><h1>Coupons</h1><p>Create and manage discount coupons for your products.</p></div><AdminModal label="＋ New coupon" title="Create coupon" description="Set a simple discount, validity and usage limit."><CouponForm products={products} /></AdminModal></header>
      <form className="admin-list-controls coupon-list-controls"><label className="order-search-field"><span>Search</span><input name="q" type="search" defaultValue={query.q} placeholder="Search coupon code…"/></label><label><span>Status</span><select name="status" defaultValue={status}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label><button className="button secondary" type="submit">Apply filters</button>{(q||status!=="ALL")?<Link className="text-button" href="/admin/coupons">Clear</Link>:null}</form>
      <section className="admin-card flush-card reference-coupon-card"><div className="admin-table-wrap"><table className="admin-table coupon-table"><thead><tr><th>Code</th><th>Discount</th><th>Min. order</th><th>Usage</th><th>Valid until</th><th>Active</th><th>Actions</th></tr></thead><tbody>{coupons.map(({ summary, detail }) => <tr key={summary.id}><td><strong>{summary.code}</strong></td><td>{summary.type === "PERCENT" ? `${summary.value / 100}% OFF` : `₹${(summary.value / 100).toLocaleString("en-IN")} OFF`}</td><td>₹{(summary.minOrderPaise/100).toLocaleString("en-IN")}</td><td>{summary.usedCount} / {summary.totalLimit ?? "∞"}</td><td>{summary.endsAt?new Date(summary.endsAt).toLocaleDateString("en-IN"):`No expiry`}</td><td><CouponStatusButton id={summary.id} active={summary.active}/></td><td><AdminModal secondary label="Edit" title={`Edit ${summary.code}`} description="Update discount, validity and package scope."><CouponForm products={products} initial={detail as CouponFormValue}/></AdminModal></td></tr>)}</tbody></table></div>{!coupons.length && <div className="clean-empty tall"><strong>No coupons found</strong><span>{filtered.length?"No coupons are available on this page.":"Create a coupon or change the filters."}</span></div>}{filtered.length?<footer className="table-pagination"><span>Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize,filtered.length)} of {filtered.length}</span><nav aria-label="Coupon pages"><Link aria-disabled={page===1} href={pageHref(Math.max(1,page-1))}>‹</Link>{Array.from({length:totalPages},(_,index)=>index+1).filter(value=>value===1||value===totalPages||Math.abs(value-page)<=1).map(value=><Link className={value===page?"active":""} href={pageHref(value)} key={value}>{value}</Link>)}<Link aria-disabled={page===totalPages} href={pageHref(Math.min(totalPages,page+1))}>›</Link></nav></footer>:null}</section>
    </WorkspaceShell>
  );
}
