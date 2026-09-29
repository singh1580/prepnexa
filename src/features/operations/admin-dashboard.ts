import { sql } from "drizzle-orm";
import { db } from "@/db/client";

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export async function getAdminDashboard() {
  const [summaryResult, revenueResult, productResult, orderResult] = await Promise.all([
    db.execute(sql`select coalesce((select sum(total_paise) from orders where status='PAID'),0)::int as "revenuePaise",(select count(*)::int from orders) as orders,(select count(*)::int from users u where exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as users,(select count(*)::int from products) as products,(select count(*)::int from products where status='PUBLISHED') as "liveProducts"`),
    db.execute(sql`select d.day::date as day,coalesce(sum(o.total_paise),0)::int as "revenuePaise" from generate_series(current_date-13,current_date,'1 day') d(day) left join orders o on o.status='PAID' and o.paid_at>=d.day and o.paid_at<d.day+interval '1 day' group by d.day order by d.day`),
    db.execute(sql`select p.id,p.name,count(o.id)::int as sold,coalesce(sum(case when o.id is not null then oi.unit_price_paise else 0 end),0)::int as "revenuePaise" from products p left join order_items oi on oi.product_id=p.id left join orders o on o.id=oi.order_id and o.status='PAID' group by p.id,p.name order by "revenuePaise" desc,p.name limit 5`),
    db.execute(sql`select o.id,o.status,o.total_paise as "totalPaise",o.created_at as "createdAt",u.name,u.email from orders o join users u on u.id=o.user_id order by o.created_at desc limit 6`),
  ]);
  return {summary:rows<{revenuePaise:number;orders:number;users:number;products:number;liveProducts:number}>(summaryResult)[0],revenue:rows<{day:Date;revenuePaise:number}>(revenueResult),topProducts:rows<{id:string;name:string;sold:number;revenuePaise:number}>(productResult),recentOrders:rows<{id:string;status:string;totalPaise:number;createdAt:Date;name:string;email:string}>(orderResult)};
}
