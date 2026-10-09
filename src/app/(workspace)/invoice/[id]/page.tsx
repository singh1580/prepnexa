import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { requireWorkspace } from "@/features/auth/page-access";
import { getManagedOrder, getStudentOrder } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { formatMoney } from "@/features/commerce/pricing";
import { PrintInvoiceButton } from "@/features/commerce/ui/print-invoice";

type Order={id:string;status:string;subtotalPaise:number;discountPaise:number;taxPaise:number;totalPaise:number;currency:string;couponCode:string|null;createdAt:Date;paidAt:Date|null;provider:string|null;providerPaymentId:string|null;studentName?:string;email?:string;items:{productId:string;name:string;pricePaise:number;accessDays:number}[]};
export const metadata={title:"Tax invoice"};

export default async function Page({params}:{params:Promise<{id:string}>}){
  const auth=await requireWorkspace();
  const parsed=commerceIdSchema.safeParse((await params).id);
  if(!parsed.success)notFound();
  const raw=auth.admin?await getManagedOrder(parsed.data):await getStudentOrder(parsed.data,auth.user.id);
  if(!raw)notFound();
  const order=raw as unknown as Order;
  if(!["PAID","REFUNDED","PARTIALLY_REFUNDED"].includes(order.status))notFound();
  const issued=new Date(order.paidAt??order.createdAt);
  const backHref=auth.admin?`/admin/orders?order=${order.id}`:`/dashboard/orders/${order.id}`;
  return <><PublicHeader/><main className="invoice-page">
    <div className="invoice-actions"><Link href={backHref}>← <span>Back to order</span></Link><PrintInvoiceButton/></div>
    <article className="invoice">
      <header><div className="invoice-brand"><strong>Prep<span>store</span></strong><b>Prepstore Digital Learning</b><small>Digital exam-preparation platform<br/>India</small></div><div className="invoice-heading"><h1>Tax invoice</h1><dl><div><dt>Invoice No:</dt><dd>INV-{order.id.slice(0,12).toUpperCase()}</dd></div><div><dt>Invoice Date:</dt><dd>{issued.toLocaleDateString("en-IN",{dateStyle:"medium"})}</dd></div><div><dt>Order ID:</dt><dd>{order.id.slice(0,16).toUpperCase()}</dd></div><div><dt>Payment ID:</dt><dd>{order.providerPaymentId??"Free order"}</dd></div><div><dt>Payment Method:</dt><dd>{order.provider?.toUpperCase()??"No payment required"}</dd></div></dl></div></header>
      <section className="invoice-billed"><div><span>Billed to</span><strong>{order.studentName??auth.user.name}</strong><small>{order.email??auth.user.email}{!auth.admin&&auth.user.phone?<><br/>{auth.user.phone}</>:null}</small></div><b>{order.status==="PAID"?"PAID":order.status.replaceAll("_"," ")}</b></section>
      <table><thead><tr><th>#</th><th>Description</th><th>Access period</th><th>Amount (₹)</th></tr></thead><tbody>{order.items.map((item,index)=><tr key={item.productId}><td>{index+1}</td><td>{item.name}</td><td>{Math.max(1,Math.round(item.accessDays/30))} months</td><td>{formatMoney(item.pricePaise,order.currency)}</td></tr>)}</tbody></table>
      <section className="invoice-total"><dl><div><dt>Subtotal</dt><dd>{formatMoney(order.subtotalPaise,order.currency)}</dd></div>{order.discountPaise>0?<div><dt>Coupon discount {order.couponCode?`(${order.couponCode})`:""}</dt><dd>− {formatMoney(order.discountPaise,order.currency)}</dd></div>:null}<div><dt>Taxable value</dt><dd>{formatMoney(order.subtotalPaise-order.discountPaise,order.currency)}</dd></div><div><dt>GST (18%)</dt><dd>{formatMoney(order.taxPaise,order.currency)}</dd></div><div><dt>Total payable</dt><dd>{formatMoney(order.totalPaise,order.currency)}</dd></div></dl></section>
      <section className="invoice-terms"><h2>Terms</h2><ol><li>This is a computer-generated tax invoice and does not require a signature.</li><li>Access to purchased digital content is provided after successful payment.</li><li>For any queries, contact Prepstore support from your dashboard.</li></ol></section>
    </article>
  </main></>;
}
