import { sql } from "drizzle-orm";
import { db } from "@/db/client";

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export async function getAdminDashboard(days = 14) {
  const safeDays = [7, 14, 30, 90].includes(days) ? days : 30;
  // Revenue is cash actually captured, less successful refunds.  Order totals
  // remain useful for invoices, but they are not an accounting ledger: a paid
  // order may later be partially or fully refunded.
  const netPayments = sql`captured as (
    select p.order_id,
      coalesce(sum(p.amount_paise) filter (where p.status in ('CAPTURED','PARTIALLY_REFUNDED','REFUNDED')),0)::bigint as captured_paise
    from payments p group by p.order_id
  ), successful_refunds as (
    select p.order_id,coalesce(sum(r.amount_paise),0)::bigint as refunded_paise
    from refunds r join payments p on p.id=r.payment_id
    where r.status='SUCCEEDED' group by p.order_id
  ), net_orders as (
    select o.id,o.paid_at,greatest(c.captured_paise-coalesce(sr.refunded_paise,0),0)::bigint as net_paise
    from orders o join captured c on c.order_id=o.id
    left join successful_refunds sr on sr.order_id=o.id
    where o.paid_at is not null
  )`;
  const [summaryResult, revenueResult, productResult, orderResult] = await Promise.all([
    db.execute(sql`with ${netPayments},bounds as(select current_date-cast(${safeDays-1} as integer) as current_start,current_date-cast(${safeDays*2-1} as integer) as previous_start) select
      coalesce((select sum(net_paise) from net_orders,bounds where paid_at>=bounds.current_start),0)::int as "revenuePaise",
      coalesce((select sum(net_paise) from net_orders,bounds where paid_at>=bounds.previous_start and paid_at<bounds.current_start),0)::int as "previousRevenuePaise",
      (select count(*)::int from orders,bounds where paid_at>=bounds.current_start and status in ('PAID','PARTIALLY_REFUNDED','REFUNDED')) as orders,
      (select count(*)::int from orders,bounds where paid_at>=bounds.previous_start and paid_at<bounds.current_start and status in ('PAID','PARTIALLY_REFUNDED','REFUNDED')) as "previousOrders",
      (select count(*)::int from users u where exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as users,
      (select count(*)::int from users u,bounds where u.created_at>=bounds.current_start and exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as "newUsers",
      (select count(*)::int from users u,bounds where u.created_at>=bounds.previous_start and u.created_at<bounds.current_start and exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as "previousNewUsers",
      (select count(*)::int from products where is_live=true) as "liveProducts",
      (select count(*)::int from products,bounds where is_live=true and created_at>=bounds.current_start) as "newLiveProducts",
      (select count(*)::int from products,bounds where is_live=true and created_at>=bounds.previous_start and created_at<bounds.current_start) as "previousNewLiveProducts" from bounds`),
    db.execute(sql`with ${netPayments} select d.day::date as day,coalesce(sum(n.net_paise),0)::int as "revenuePaise" from generate_series(current_date-cast(${safeDays - 1} as integer),current_date,interval '1 day') d(day) left join net_orders n on n.paid_at>=d.day and n.paid_at<d.day+interval '1 day' group by d.day order by d.day`),
    db.execute(sql`with ${netPayments} select p.id,p.name,count(distinct n.id)::int as sold,
      coalesce(sum(case when o.subtotal_paise>0 then round(n.net_paise::numeric*(oi.unit_price_paise*oi.quantity)/o.subtotal_paise) else 0 end),0)::int as "revenuePaise"
      from products p left join order_items oi on oi.product_id=p.id left join orders o on o.id=oi.order_id
      left join net_orders n on n.id=o.id group by p.id,p.name order by "revenuePaise" desc,p.name limit 5`),
    db.execute(sql`select o.id,o.status,o.total_paise as "totalPaise",o.created_at as "createdAt",u.name,u.email from orders o join users u on u.id=o.user_id order by o.created_at desc limit 6`),
  ]);
  return {days:safeDays,summary:rows<{revenuePaise:number;previousRevenuePaise:number;orders:number;previousOrders:number;users:number;newUsers:number;previousNewUsers:number;liveProducts:number;newLiveProducts:number;previousNewLiveProducts:number}>(summaryResult)[0],revenue:rows<{day:Date;revenuePaise:number}>(revenueResult),topProducts:rows<{id:string;name:string;sold:number;revenuePaise:number}>(productResult),recentOrders:rows<{id:string;status:string;totalPaise:number;createdAt:Date;name:string;email:string}>(orderResult)};
}
