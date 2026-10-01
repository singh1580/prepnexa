import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getStudentOrder } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { formatMoney } from "@/features/commerce/pricing";
import { ClearCartOnMount } from "@/features/commerce/ui/cart-workflow";

type Order={id:string;status:string;totalPaise:number;currency:string;items:{productId:string;name:string}[]};
export const metadata={title:"Payment successful"};
export default async function Page({searchParams}:{searchParams:Promise<{order?:string}>}){const auth=await requireWorkspace();if(auth.admin)redirect("/admin");const parsed=commerceIdSchema.safeParse((await searchParams).order);if(!parsed.success)notFound();const raw=await getStudentOrder(parsed.data,auth.user.id);if(!raw)notFound();const order=raw as unknown as Order;if(!["PAID","PARTIALLY_REFUNDED","REFUNDED"].includes(order.status))redirect(`/dashboard/orders/${order.id}`);return <WorkspaceShell admin={false} name={auth.user.name} section="orders"><ClearCartOnMount/><section className="payment-success-card"><span className="success-check" aria-hidden="true">✓</span><span className="eyebrow">PAYMENT SUCCESSFUL</span><h1>Your package is ready</h1><p>Payment of <strong>{formatMoney(order.totalPaise,order.currency)}</strong> was confirmed. Access has been added to My Packages.</p><div className="success-order"><span>Order</span><strong>#{order.id.slice(0,12).toUpperCase()}</strong><small>{order.items.map(item=>item.name).join(", ")}</small></div><div className="success-actions"><Link className="button" href="/dashboard/packages">Start learning</Link><Link className="button secondary" href={`/invoice/${order.id}`}>View invoice</Link></div></section></WorkspaceShell>}
