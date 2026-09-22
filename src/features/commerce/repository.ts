import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, couponProducts, coupons, paymentAttempts, products } from "@/db/schema";
import type { CouponInput } from "./validation";
import type { ProviderCheckout, VerifiedPaymentEvent } from "./providers";

type Audit = { actorUserId: string; requestId: string };
function rows<T>(value: Awaited<ReturnType<typeof db.execute>>) { return value.rows as T[]; }

export async function releaseExpiredCommerce() {
  await db.execute(sql`
    with released as (
      update coupon_redemptions set status='RELEASED', released_at=now()
      where status='RESERVED' and expires_at <= now() returning order_id
    )
    update orders set status='CANCELLED', cancelled_at=now(), updated_at=now()
    where status in ('CREATED','PENDING') and expires_at <= now()
  `);
}

export async function listManagedCoupons() {
  const result = await db.execute(sql`
    select c.id,c.code,c.type,c.value,c.currency,c.max_discount_paise as "maxDiscountPaise",c.min_order_paise as "minOrderPaise",
      c.total_limit as "totalLimit",c.per_user_limit as "perUserLimit",c.starts_at as "startsAt",c.ends_at as "endsAt",c.active,
      c.created_at as "createdAt",c.updated_at as "updatedAt",
      (select count(*)::int from coupon_products cp where cp.coupon_id=c.id) as "productCount",
      (select count(*)::int from coupon_redemptions cr where cr.coupon_id=c.id and cr.status='CONSUMED') as "usedCount",
      (select count(*)::int from coupon_redemptions cr where cr.coupon_id=c.id and cr.status='RESERVED' and cr.expires_at>now()) as "reservedCount"
    from coupons c order by c.created_at desc
  `);
  return rows<Record<string, unknown>>(result);
}

export function listCouponProducts() {
  return db.select({ id: products.id, name: products.name, pricePaise: products.pricePaise, currency: products.currency })
    .from(products).where(eq(products.status, "PUBLISHED")).orderBy(asc(products.name));
}

export async function findManagedCoupon(id: string) {
  const coupon = await db.query.coupons.findFirst({ where: eq(coupons.id, id) });
  if (!coupon) return undefined;
  const linked = await db.select({ id: products.id, name: products.name }).from(couponProducts)
    .innerJoin(products, eq(products.id, couponProducts.productId)).where(eq(couponProducts.couponId, id)).orderBy(asc(products.name));
  return { ...coupon, products: linked };
}

export async function insertCoupon(input: CouponInput, audit: Audit) {
  const id = randomUUID();
  const values = {
    id, code: input.code, type: input.type, value: input.value, currency: input.type === "FIXED" ? input.currency : null,
    maxDiscountPaise: input.maxDiscountPaise, minOrderPaise: input.minOrderPaise, totalLimit: input.totalLimit,
    perUserLimit: input.perUserLimit, startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null, active: input.active, createdBy: audit.actorUserId,
  };
  const links = input.productIds.map(productId => ({ couponId: id, productId }));
  const auditEntry = db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "coupon.created", entityType: "coupon", entityId: id, requestId: audit.requestId, after: values });
  if (links.length) await db.batch([db.insert(coupons).values(values), db.insert(couponProducts).values(links), auditEntry]);
  else await db.batch([db.insert(coupons).values(values), auditEntry]);
  return { id };
}

export async function updateCouponRecord(id: string, input: CouponInput, audit: Audit) {
  const before = await findManagedCoupon(id);
  if (!before) return undefined;
  const update = {
    code: input.code, type: input.type, value: input.value, currency: input.type === "FIXED" ? input.currency : null,
    maxDiscountPaise: input.maxDiscountPaise, minOrderPaise: input.minOrderPaise, totalLimit: input.totalLimit,
    perUserLimit: input.perUserLimit, startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null, active: input.active, updatedAt: new Date(),
  };
  await db.batch([
    db.update(coupons).set(update).where(eq(coupons.id, id)),
    db.delete(couponProducts).where(eq(couponProducts.couponId, id)),
    ...(input.productIds.length ? [db.insert(couponProducts).values(input.productIds.map(productId => ({ couponId: id, productId })))] : []),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "coupon.updated", entityType: "coupon", entityId: id, requestId: audit.requestId, before: { ...before, products: before.products.map(item => item.id) }, after: { ...update, productIds: input.productIds } }),
  ]);
  return { id };
}

export async function setCouponActiveRecord(id: string, active: boolean, audit: Audit) {
  const [updated] = await db.update(coupons).set({ active, updatedAt: new Date() }).where(eq(coupons.id, id)).returning({ id: coupons.id });
  if (!updated) return undefined;
  await db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: active ? "coupon.enabled" : "coupon.disabled", entityType: "coupon", entityId: id, requestId: audit.requestId, after: { active } });
  return updated;
}

export async function findCheckoutProduct(productId: string, userId: string) {
  const result = await db.execute(sql`
    select p.id,p.slug,p.name,p.description,p.price_paise as "pricePaise",p.currency,p.access_days as "accessDays",p.refund_policy as "refundPolicy",
      exists(select 1 from entitlements e where e.user_id=${userId} and e.product_id=p.id and e.status='ACTIVE' and e.starts_at<=now() and e.expires_at>now()) as "alreadyOwned"
    from products p where p.id=${productId} and p.status='PUBLISHED' limit 1
  `);
  return rows<{ id:string;slug:string;name:string;description:string|null;pricePaise:number;currency:string;accessDays:number;refundPolicy:string;alreadyOwned:boolean }>(result)[0];
}

export async function evaluateCoupon(code: string, productId: string, userId: string, subtotalPaise: number, currency: string) {
  const result = await db.execute(sql`
    select c.id,c.code,c.type,c.value,c.max_discount_paise as "maxDiscountPaise",c.min_order_paise as "minOrderPaise",
      c.total_limit as "totalLimit",c.per_user_limit as "perUserLimit",
      (select count(*)::int from coupon_redemptions cr where cr.coupon_id=c.id and (cr.status='CONSUMED' or (cr.status='RESERVED' and cr.expires_at>now()))) as "totalUsed",
      (select count(*)::int from coupon_redemptions cr where cr.coupon_id=c.id and cr.user_id=${userId} and (cr.status='CONSUMED' or (cr.status='RESERVED' and cr.expires_at>now()))) as "userUsed"
    from coupons c where c.code=${code} and c.active=true and (c.starts_at is null or c.starts_at<=now()) and (c.ends_at is null or c.ends_at>now())
      and c.min_order_paise<=${subtotalPaise} and (c.currency is null or c.currency=${currency})
      and (not exists(select 1 from coupon_products cp where cp.coupon_id=c.id) or exists(select 1 from coupon_products cp where cp.coupon_id=c.id and cp.product_id=${productId}))
    limit 1
  `);
  return rows<{ id:string;code:string;type:"FIXED"|"PERCENT";value:number;maxDiscountPaise:number|null;minOrderPaise:number;totalLimit:number|null;perUserLimit:number;totalUsed:number;userUsed:number }>(result)[0];
}

export async function findOrderByIdempotency(userId: string, idempotencyKey: string) {
  const result = await db.execute(sql`
    select o.id,o.status,o.subtotal_paise as "subtotalPaise",o.discount_paise as "discountPaise",o.total_paise as "totalPaise",o.currency,
      o.coupon_code as "couponCode",o.expires_at as "expiresAt",pa.id as "paymentAttemptId",pa.provider,pa.checkout_reference as "checkoutReference"
    from orders o left join lateral (select * from payment_attempts x where x.order_id=o.id order by x.created_at desc limit 1) pa on true
    where o.user_id=${userId} and o.idempotency_key=${idempotencyKey} limit 1
  `);
  return rows<CheckoutOrder>(result)[0];
}

export type CheckoutOrder = { id:string;status:string;subtotalPaise:number;discountPaise:number;totalPaise:number;currency:string;couponCode:string|null;expiresAt:Date;paymentAttemptId:string|null;provider:string|null;checkoutReference:string|null };

export async function insertCheckoutOrder(input: { userId:string;productId:string;idempotencyKey:string;couponId:string|null;couponCode:string|null;requestId:string }) {
  const orderId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  const result = input.couponId ? await db.execute(sql`
    with locked_coupon as (
      select c.* from coupons c where c.id=${input.couponId} and c.code=${input.couponCode} and c.active=true
        and (c.starts_at is null or c.starts_at<=now()) and (c.ends_at is null or c.ends_at>now()) for update
    ), priced as (
      select p.*,c.id as coupon_id,c.code as coupon_code,
        least(p.price_paise, case when c.type='FIXED' then c.value else floor(p.price_paise*c.value/10000.0)::int end,
          coalesce(c.max_discount_paise,p.price_paise))::int as discount
      from products p cross join locked_coupon c where p.id=${input.productId} and p.status='PUBLISHED'
        and p.price_paise>=c.min_order_paise and (c.currency is null or c.currency=p.currency)
        and (not exists(select 1 from coupon_products cp where cp.coupon_id=c.id) or exists(select 1 from coupon_products cp where cp.coupon_id=c.id and cp.product_id=p.id))
        and (c.total_limit is null or (select count(*) from coupon_redemptions cr where cr.coupon_id=c.id and (cr.status='CONSUMED' or (cr.status='RESERVED' and cr.expires_at>now())))<c.total_limit)
        and (select count(*) from coupon_redemptions cr where cr.coupon_id=c.id and cr.user_id=${input.userId} and (cr.status='CONSUMED' or (cr.status='RESERVED' and cr.expires_at>now())))<c.per_user_limit
        and not exists(select 1 from entitlements e where e.user_id=${input.userId} and e.product_id=p.id and e.status='ACTIVE' and e.starts_at<=now() and e.expires_at>now())
    ), created_order as (
      insert into orders(id,user_id,status,subtotal_paise,discount_paise,total_paise,currency,coupon_code,idempotency_key,expires_at,created_at,updated_at)
      select ${orderId}::uuid,${input.userId}::uuid,case when price_paise-discount=0 then 'CREATED'::order_status else 'PENDING'::order_status end,
        price_paise,discount,price_paise-discount,currency,coupon_code,${input.idempotencyKey},${expiresAt},now(),now() from priced
      on conflict(idempotency_key) do nothing returning *
    ), created_item as (
      insert into order_items(order_id,product_id,product_name,unit_price_paise,access_days,quantity)
      select o.id,p.id,p.name,p.price_paise,p.access_days,1 from created_order o join priced p on true returning order_id
    ), reserved as (
      insert into coupon_redemptions(coupon_id,user_id,order_id,status,discount_paise,expires_at,created_at)
      select p.coupon_id,${input.userId}::uuid,o.id,'RESERVED',p.discount,${expiresAt},now() from created_order o join priced p on true returning order_id
    ), logged as (
      insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,after)
      select ${input.userId}::uuid,'order.created','order',o.id::text,${input.requestId},jsonb_build_object('productId',${input.productId}::text,'couponCode',${input.couponCode}::text) from created_order o returning id
    ) select id,status,subtotal_paise as "subtotalPaise",discount_paise as "discountPaise",total_paise as "totalPaise",currency,coupon_code as "couponCode",expires_at as "expiresAt",null::uuid as "paymentAttemptId",null::text as provider,null::text as "checkoutReference" from created_order
  `) : await db.execute(sql`
    with priced as (
      select p.* from products p where p.id=${input.productId} and p.status='PUBLISHED'
        and not exists(select 1 from entitlements e where e.user_id=${input.userId} and e.product_id=p.id and e.status='ACTIVE' and e.starts_at<=now() and e.expires_at>now())
    ), created_order as (
      insert into orders(id,user_id,status,subtotal_paise,discount_paise,total_paise,currency,idempotency_key,expires_at,created_at,updated_at)
      select ${orderId}::uuid,${input.userId}::uuid,case when price_paise=0 then 'CREATED'::order_status else 'PENDING'::order_status end,
        price_paise,0,price_paise,currency,${input.idempotencyKey},${expiresAt},now(),now() from priced
      on conflict(idempotency_key) do nothing returning *
    ), created_item as (
      insert into order_items(order_id,product_id,product_name,unit_price_paise,access_days,quantity)
      select o.id,p.id,p.name,p.price_paise,p.access_days,1 from created_order o join priced p on true returning order_id
    ), logged as (
      insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,after)
      select ${input.userId}::uuid,'order.created','order',o.id::text,${input.requestId},jsonb_build_object('productId',${input.productId}::text) from created_order o returning id
    ) select id,status,subtotal_paise as "subtotalPaise",discount_paise as "discountPaise",total_paise as "totalPaise",currency,coupon_code as "couponCode",expires_at as "expiresAt",null::uuid as "paymentAttemptId",null::text as provider,null::text as "checkoutReference" from created_order
  `);
  return rows<CheckoutOrder>(result)[0];
}

export async function finalizeFreeOrder(orderId: string, userId: string, requestId: string) {
  const result = await db.execute(sql`
    with paid as (
      update orders set status='PAID',paid_at=now(),updated_at=now() where id=${orderId} and user_id=${userId} and status='CREATED' and total_paise=0 and expires_at>now() returning id
    ), consumed as (
      update coupon_redemptions set status='CONSUMED',consumed_at=now() where order_id in(select id from paid) and status='RESERVED' returning order_id
    ), granted as (
      insert into entitlements(user_id,product_id,order_id,status,starts_at,expires_at,created_at)
      select ${userId}::uuid,oi.product_id,o.id,'ACTIVE',now(),now()+make_interval(days=>oi.access_days),now()
      from paid p join orders o on o.id=p.id join order_items oi on oi.order_id=o.id
      on conflict(order_id,product_id) do nothing returning id
    ), logged as (
      insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,after)
      select ${userId}::uuid,'order.free_completed','order',id::text,${requestId},jsonb_build_object('totalPaise',0) from paid returning id
    ) select id from paid
  `);
  return rows<{id:string}>(result)[0];
}

export async function insertPaymentAttempt(input: { orderId:string;provider:string;idempotencyKey:string;amountPaise:number;currency:string;expiresAt:Date }) {
  const id = randomUUID();
  const [created] = await db.insert(paymentAttempts).values({ id, orderId: input.orderId, provider: input.provider, status: "CREATED", idempotencyKey: input.idempotencyKey, amountPaise: input.amountPaise, currency: input.currency, expiresAt: input.expiresAt }).onConflictDoNothing().returning();
  return created ?? (await db.query.paymentAttempts.findFirst({ where: eq(paymentAttempts.idempotencyKey, input.idempotencyKey) }));
}

export async function saveProviderCheckout(attemptId: string, checkout: ProviderCheckout) {
  const [row] = await db.update(paymentAttempts).set({ providerOrderId: checkout.providerOrderId, checkoutReference: checkout.checkoutReference, expiresAt: checkout.expiresAt, rawMetadata: checkout.metadata, status: "PENDING", updatedAt: new Date() }).where(eq(paymentAttempts.id, attemptId)).returning();
  return row;
}

export async function failPaymentAttempt(attemptId: string, code: string) {
  await db.update(paymentAttempts).set({ status: "FAILED", failureCode: code, updatedAt: new Date() }).where(eq(paymentAttempts.id, attemptId));
}

export async function findStudentPaymentAttempt(attemptId: string, userId: string) {
  const result = await db.execute(sql`
    select pa.id as "attemptId",pa.order_id as "orderId",pa.provider,pa.provider_order_id as "providerOrderId",pa.status,
      pa.amount_paise as "amountPaise",pa.currency,o.user_id as "userId",o.status as "orderStatus"
    from payment_attempts pa join orders o on o.id=pa.order_id where pa.id=${attemptId} and o.user_id=${userId} limit 1
  `);
  return rows<{attemptId:string;orderId:string;provider:string;providerOrderId:string|null;status:string;amountPaise:number;currency:string;userId:string;orderStatus:string}>(result)[0];
}

export async function findProviderAttempt(provider: string, providerOrderId: string) {
  const result = await db.execute(sql`
    select pa.id as "attemptId",pa.order_id as "orderId",pa.status,pa.amount_paise as "amountPaise",pa.currency,o.user_id as "userId",o.status as "orderStatus"
    from payment_attempts pa join orders o on o.id=pa.order_id where pa.provider=${provider} and pa.provider_order_id=${providerOrderId} limit 1
  `);
  return rows<{attemptId:string;orderId:string;status:string;amountPaise:number;currency:string;userId:string;orderStatus:string}>(result)[0];
}

export async function processPaymentEvent(provider: string, event: VerifiedPaymentEvent, requestId: string) {
  const paymentId = randomUUID();
  const result = event.type === "PAYMENT_CAPTURED" ? await db.execute(sql`
    with received as (
      insert into webhook_events(provider,provider_event_id,event_type,signature_verified,payload,created_at)
      values(${provider},${event.eventId},${event.type},true,${JSON.stringify(event.payload)}::jsonb,now())
      on conflict(provider,provider_event_id) do nothing returning id
    ), target as (
      select pa.*,o.user_id from payment_attempts pa join orders o on o.id=pa.order_id join received r on true
      where pa.provider=${provider} and pa.provider_order_id=${event.providerOrderId} and pa.amount_paise=${event.amountPaise} and pa.currency=${event.currency}
        and pa.status in('CREATED','PENDING') and o.status in('CREATED','PENDING') for update of pa,o
    ), captured as (
      insert into payments(id,order_id,provider,provider_order_id,provider_payment_id,idempotency_key,status,amount_paise,currency,verified_at,raw_metadata,created_at,updated_at)
      select ${paymentId}::uuid,t.order_id,${provider},${event.providerOrderId},${event.providerPaymentId},${`webhook:${provider}:${event.eventId}`},'CAPTURED',${event.amountPaise},${event.currency},now(),${JSON.stringify(event.payload)}::jsonb,now(),now() from target t
      on conflict(provider,provider_payment_id) do nothing returning id,order_id
    ), attempt_done as (
      update payment_attempts set status='CAPTURED',updated_at=now() where id in(select id from target) and exists(select 1 from captured) returning order_id
    ), paid as (
      update orders set status='PAID',paid_at=now(),updated_at=now() where id in(select order_id from captured) returning id,user_id
    ), consumed as (
      update coupon_redemptions set status='CONSUMED',consumed_at=now() where order_id in(select id from paid) and status='RESERVED' returning order_id
    ), granted as (
      insert into entitlements(user_id,product_id,order_id,status,starts_at,expires_at,created_at)
      select p.user_id,oi.product_id,p.id,'ACTIVE',now(),now()+make_interval(days=>oi.access_days),now() from paid p join order_items oi on oi.order_id=p.id
      on conflict(order_id,product_id) do nothing returning id
    ), finished as (
      update webhook_events set processed_at=now() where id in(select id from received) and exists(select 1 from paid) returning id
    ), logged as (
      insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,after)
      select p.user_id,'payment.captured','order',p.id::text,${requestId},jsonb_build_object('paymentId',${paymentId}::text,'provider',${provider}::text) from paid p returning id
    ) select id from paid
  `) : await db.execute(sql`
    with received as (
      insert into webhook_events(provider,provider_event_id,event_type,signature_verified,payload,created_at)
      values(${provider},${event.eventId},${event.type},true,${JSON.stringify(event.payload)}::jsonb,now())
      on conflict(provider,provider_event_id) do nothing returning id
    ), failed_attempt as (
      update payment_attempts set status='FAILED',failure_code='PROVIDER_FAILED',updated_at=now()
      where provider=${provider} and provider_order_id=${event.providerOrderId} and exists(select 1 from received) returning order_id
    ), failed_order as (
      update orders set status='FAILED',updated_at=now() where id in(select order_id from failed_attempt) and status in('CREATED','PENDING') returning id
    ), released as (
      update coupon_redemptions set status='RELEASED',released_at=now() where order_id in(select id from failed_order) and status='RESERVED' returning order_id
    ), finished as (
      update webhook_events set processed_at=now() where id in(select id from received) returning id
    ) select id from failed_order
  `);
  const processed = rows<{id:string}>(result)[0];
  if (processed) return { orderId: processed.id, duplicate: false };
  const duplicate = event.providerPaymentId ? await db.execute(sql`
    select p.order_id as "orderId" from payments p join orders o on o.id=p.order_id
    where p.provider=${provider} and p.provider_payment_id=${event.providerPaymentId} and p.status in('CAPTURED','PARTIALLY_REFUNDED','REFUNDED')
      and o.status in('PAID','PARTIALLY_REFUNDED','REFUNDED') limit 1
  `) : await db.execute(sql`select null::uuid as "orderId" where false`);
  const existing = rows<{orderId:string}>(duplicate)[0];
  return existing ? { orderId: existing.orderId, duplicate: true } : undefined;
}

export async function listStudentOrders(userId: string) {
  const result = await db.execute(sql`
    select o.id,o.status,o.subtotal_paise as "subtotalPaise",o.discount_paise as "discountPaise",o.total_paise as "totalPaise",o.currency,o.coupon_code as "couponCode",o.created_at as "createdAt",o.paid_at as "paidAt",
      coalesce(jsonb_agg(jsonb_build_object('productId',oi.product_id,'name',oi.product_name,'pricePaise',oi.unit_price_paise,'accessDays',oi.access_days) order by oi.id),'[]'::jsonb) as items
    from orders o join order_items oi on oi.order_id=o.id where o.user_id=${userId} group by o.id order by o.created_at desc
  `);
  return rows<Record<string,unknown>>(result);
}

export async function listManagedOrders() {
  const result = await db.execute(sql`
    select o.id,o.status,o.subtotal_paise as "subtotalPaise",o.discount_paise as "discountPaise",o.total_paise as "totalPaise",o.currency,o.coupon_code as "couponCode",
      o.created_at as "createdAt",o.paid_at as "paidAt",u.name as "studentName",u.email,
      coalesce((select string_agg(oi.product_name,', ' order by oi.product_name) from order_items oi where oi.order_id=o.id),'') as products,
      p.id as "paymentId",p.status as "paymentStatus",p.amount_paise as "paymentAmountPaise",
      coalesce((select sum(r.amount_paise)::int from refunds r where r.payment_id=p.id and r.status in('PROCESSING','SUCCEEDED')),0) as "refundedPaise"
    from orders o join users u on u.id=o.user_id
    left join lateral (select x.* from payments x where x.order_id=o.id order by x.created_at desc limit 1) p on true
    order by o.created_at desc limit 200
  `);
  return rows<Record<string,unknown>>(result);
}

export async function findRefundTarget(paymentId: string) {
  const result = await db.execute(sql`
    select p.id,p.order_id as "orderId",p.provider,p.provider_payment_id as "providerPaymentId",p.amount_paise as "amountPaise",p.currency,p.status,
      coalesce((select sum(r.amount_paise)::int from refunds r where r.payment_id=p.id and r.status in('PROCESSING','SUCCEEDED')),0) as "refundedPaise"
    from payments p where p.id=${paymentId} and p.status in('CAPTURED','PARTIALLY_REFUNDED') limit 1
  `);
  return rows<{id:string;orderId:string;provider:string;providerPaymentId:string|null;amountPaise:number;currency:string;status:string;refundedPaise:number}>(result)[0];
}

export async function findRefundByIdempotency(paymentId: string, idempotencyKey: string) {
  const result = await db.execute(sql`
    select id,status from refunds where payment_id=${paymentId} and idempotency_key=${idempotencyKey} limit 1
  `);
  return rows<{id:string;status:string}>(result)[0];
}

export async function saveRefund(input: { paymentId:string;provider:string;providerRefundId:string;idempotencyKey:string;amountPaise:number;reason:string;revokeAccess:boolean;requestedBy:string;status:"SUCCEEDED"|"PROCESSING";requestId:string }) {
  const refundId = randomUUID();
  const result = await db.execute(sql`
    with target as (
      select p.*,coalesce((select sum(r.amount_paise) from refunds r where r.payment_id=p.id and r.status in('PROCESSING','SUCCEEDED')),0) as refunded
      from payments p where p.id=${input.paymentId} and p.status in('CAPTURED','PARTIALLY_REFUNDED') for update
    ), created as (
      insert into refunds(id,payment_id,provider,provider_refund_id,idempotency_key,status,amount_paise,reason,revoke_access,requested_by,processed_at,created_at,updated_at)
      select ${refundId}::uuid,id,${input.provider},${input.providerRefundId},${input.idempotencyKey},${input.status}::refund_status,${input.amountPaise},${input.reason},${input.revokeAccess},${input.requestedBy}::uuid,
        case when ${input.status}='SUCCEEDED' then now() else null end,now(),now() from target where refunded+${input.amountPaise}<=amount_paise
      on conflict(idempotency_key) do nothing returning id,payment_id,status
    ), totals as (
      select t.id,t.order_id,t.amount_paise,t.refunded+${input.amountPaise} as new_total from target t join created c on c.payment_id=t.id where c.status='SUCCEEDED'
    ), payment_updated as (
      update payments p set status=case when x.new_total=x.amount_paise then 'REFUNDED'::payment_status else 'PARTIALLY_REFUNDED'::payment_status end,updated_at=now()
      from totals x where p.id=x.id returning p.order_id,p.status
    ), order_updated as (
      update orders o set status=case when p.status='REFUNDED' then 'REFUNDED'::order_status else 'PARTIALLY_REFUNDED'::order_status end,updated_at=now()
      from payment_updated p where o.id=p.order_id returning o.id
    ), revoked as (
      update entitlements set status='REFUNDED',revoked_at=now() where order_id in(select id from order_updated) and ${input.revokeAccess} returning id
    ), logged as (
      insert into audit_logs(actor_user_id,action,entity_type,entity_id,request_id,after)
      select ${input.requestedBy}::uuid,'refund.created','refund',id::text,${input.requestId},jsonb_build_object('paymentId',${input.paymentId}::text,'amountPaise',${input.amountPaise}::int,'revokeAccess',${input.revokeAccess}::boolean) from created returning id
    ) select id,status from created
  `);
  return rows<{id:string;status:string}>(result)[0];
}
