import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentOrder } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { formatMoney } from "@/features/commerce/pricing";
import { ClearCartOnMount } from "@/features/commerce/ui/cart-workflow";

type Order={id:string;status:string;totalPaise:number;currency:string;items:{productId:string;name:string;pricePaise:number;accessDays:number}[]};
export const metadata={title:"Payment successful"};

export default async function Page({searchParams}:{searchParams:Promise<{order?:string}>}){
  const auth=await requireWorkspace();if(auth.admin)redirect("/admin");const parsed=commerceIdSchema.safeParse((await searchParams).order);if(!parsed.success)notFound();const raw=await getStudentOrder(parsed.data,auth.user.id);if(!raw)notFound();const order=raw as unknown as Order;if(!["PAID","PARTIALLY_REFUNDED","REFUNDED"].includes(order.status))redirect(`/dashboard/orders/${order.id}`);
  return <><PublicHeader/><main className="payment-success-page"><ClearCartOnMount/><section className="payment-success-panel"><span className="success-check" aria-hidden="true">✓</span><h1>Payment successful!</h1><p>Thank you for your purchase. Your packages are now active<br/>and ready to use.</p><div className="success-order"><span>Order ID</span><strong>#{order.id.slice(0,12).toUpperCase()}</strong><small>Amount paid</small><b>{formatMoney(order.totalPaise,order.currency)}</b></div><section className="success-products"><h2>Your purchased packages</h2>{order.items.map(item=><article key={item.productId}><span>{item.name.slice(0,2).toUpperCase()}</span><div><strong>{item.name}</strong><small>{Math.max(1,Math.round(item.accessDays/30))} months access</small></div><b>{formatMoney(item.pricePaise,order.currency)}</b></article>)}</section><div className="success-next"><b>◷</b><span><strong>Next step</strong><small>You can now start learning. Your packages are available in My Packages.</small></span></div><div className="success-actions"><Link className="reference-checkout-button" href="/dashboard/courses">Go to My Packages</Link><Link className="reference-outline-button" href={`/dashboard/orders/${order.id}`}>View order details</Link></div></section></main></>;
}
