import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { formatMoney } from "@/features/commerce/pricing";
import { getStudentOrders } from "@/features/commerce/service";
import { getStudentNotifications } from "@/features/operations/service";

type Order={id:string;status:string;totalPaise:number;currency:string;createdAt:Date;items:{name:string}[]};
type Filter="all"|"paid"|"pending"|"failed";
const group=(status:string):Exclude<Filter,"all">=>status==="PAID"?"paid":["CREATED","PENDING"].includes(status)?"pending":"failed";
export const metadata={title:"My orders"};

export default async function Page({searchParams}:{searchParams:Promise<{status?:string}>}){
  const auth=await requireWorkspace();if(auth.admin)redirect("/admin");
  const selected=(await searchParams).status;const filter:Filter=selected==="paid"||selected==="pending"||selected==="failed"?selected:"all";
  const[raw,notifications]=await Promise.all([getStudentOrders(auth.user.id),getStudentNotifications(auth.user.id)]);const orders=raw as unknown as Order[];
  const visible=filter==="all"?orders:orders.filter(order=>group(order.status)===filter);
  const counts={all:orders.length,paid:orders.filter(order=>group(order.status)==="paid").length,pending:orders.filter(order=>group(order.status)==="pending").length,failed:orders.filter(order=>group(order.status)==="failed").length};
  return <WorkspaceShell admin={false} name={auth.user.name} section="orders" unreadNotifications={notifications.unreadCount}>
    <header className="student-page-heading"><div><h1>My Orders</h1><p>View your order history and download invoices.</p></div></header>
    <section className="reference-orders"><nav aria-label="Filter orders">{(["all","paid","pending","failed"] as Filter[]).map(key=><Link className={filter===key?"active":""} href={key==="all"?"/dashboard/orders":`/dashboard/orders?status=${key}`} key={key}>{key[0].toUpperCase()+key.slice(1)} <b>{counts[key]}</b></Link>)}</nav>{visible.length?<div className="orders-table-wrap"><table><thead><tr><th>Order ID</th><th>Date</th><th>Packages</th><th>Total</th><th>Payment status</th><th>Actions</th></tr></thead><tbody>{visible.map(order=><tr key={order.id}><td data-label="Order ID"><strong>#{order.id.slice(0,8).toUpperCase()}</strong></td><td data-label="Date">{new Date(order.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td data-label="Packages"><span>{order.items.map(item=>item.name).join(", ")}</span></td><td data-label="Total"><strong>{formatMoney(order.totalPaise,order.currency)}</strong></td><td data-label="Payment status"><b className={`order-status ${group(order.status)}`}>● {group(order.status)[0].toUpperCase()+group(order.status).slice(1)}</b></td><td data-label="Actions"><div className="order-row-actions"><Link href={`/dashboard/orders/${order.id}`}>View order</Link>{order.status==="PAID"?<Link className="invoice" href={`/invoice/${order.id}`}>Invoice</Link>:null}</div></td></tr>)}</tbody></table><p>Showing {visible.length} of {orders.length} orders</p></div>:<div className="student-empty-package"><h2>No {filter==="all"?"":filter} orders found</h2><p>Your matching orders will appear here.</p>{filter==="all"?<Link href="/packages">Explore packages</Link>:null}</div>}</section>
  </WorkspaceShell>;
}
