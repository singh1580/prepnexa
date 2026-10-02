import { sql } from "drizzle-orm";
import { db } from "@/db/client";

function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export async function getAdminDashboard(days = 14) {
  const safeDays = [7, 14, 30, 90].includes(days) ? days : 30;
  const [summaryResult, revenueResult, productResult, orderResult] = await Promise.all([
    db.execute(sql`with bounds as(select current_date-cast(${safeDays-1} as integer) as current_start,current_date-cast(${safeDays*2-1} as integer) as previous_start) select
      coalesce((select sum(total_paise) from orders,bounds where status='PAID' and paid_at>=bounds.current_start),0)::int as "revenuePaise",
      coalesce((select sum(total_paise) from orders,bounds where status='PAID' and paid_at>=bounds.previous_start and paid_at<bounds.current_start),0)::int as "previousRevenuePaise",
      (select count(*)::int from orders,bounds where status='PAID' and paid_at>=bounds.current_start) as orders,
      (select count(*)::int from orders,bounds where status='PAID' and paid_at>=bounds.previous_start and paid_at<bounds.current_start) as "previousOrders",
      (select count(*)::int from users u where exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as users,
      (select count(*)::int from users u,bounds where u.created_at>=bounds.current_start and exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as "newUsers",
      (select count(*)::int from users u,bounds where u.created_at>=bounds.previous_start and u.created_at<bounds.current_start and exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.key='STUDENT')) as "previousNewUsers",
      (select count(*)::int from products where is_live=true) as "liveProducts",
      (select count(*)::int from products,bounds where is_live=true and created_at>=bounds.current_start) as "newLiveProducts",
      (select count(*)::int from products,bounds where is_live=true and created_at>=bounds.previous_start and created_at<bounds.current_start) as "previousNewLiveProducts" from bounds`),
    db.execute(sql`select d.day::date as day,coalesce(sum(o.total_paise),0)::int as "revenuePaise" from generate_series(current_date-cast(${safeDays - 1} as integer),current_date,interval '1 day') d(day) left join orders o on o.status='PAID' and o.paid_at>=d.day and o.paid_at<d.day+interval '1 day' group by d.day order by d.day`),
    db.execute(sql`select p.id,p.name,count(o.id)::int as sold,coalesce(sum(case when o.id is not null then oi.unit_price_paise else 0 end),0)::int as "revenuePaise" from products p left join order_items oi on oi.product_id=p.id left join orders o on o.id=oi.order_id and o.status='PAID' group by p.id,p.name order by "revenuePaise" desc,p.name limit 5`),
    db.execute(sql`select o.id,o.status,o.total_paise as "totalPaise",o.created_at as "createdAt",u.name,u.email from orders o join users u on u.id=o.user_id order by o.created_at desc limit 6`),
  ]);
  return {days:safeDays,summary:rows<{revenuePaise:number;previousRevenuePaise:number;orders:number;previousOrders:number;users:number;newUsers:number;previousNewUsers:number;liveProducts:number;newLiveProducts:number;previousNewLiveProducts:number}>(summaryResult)[0],revenue:rows<{day:Date;revenuePaise:number}>(revenueResult),topProducts:rows<{id:string;name:string;sold:number;revenuePaise:number}>(productResult),recentOrders:rows<{id:string;status:string;totalPaise:number;createdAt:Date;name:string;email:string}>(orderResult)};
}
