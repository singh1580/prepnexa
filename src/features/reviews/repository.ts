import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, entitlements, orders, productReviews, products, users } from "@/db/schema";

export async function listReviewableProducts(userId: string) {
  const latestPurchase = sql<Date | null>`max(${orders.paidAt})`;
  return db.select({
    productId: products.id,
    slug: products.slug,
    name: products.name,
    purchasedAt: latestPurchase,
    reviewId: productReviews.id,
    rating: productReviews.rating,
    comment: productReviews.comment,
    feedback: productReviews.feedback,
    reviewStatus: productReviews.status,
    moderationNote: productReviews.moderationNote,
    reviewedAt: productReviews.updatedAt,
  }).from(entitlements)
    .innerJoin(orders, eq(orders.id, entitlements.orderId))
    .innerJoin(products, eq(products.id, entitlements.productId))
    .leftJoin(productReviews, and(eq(productReviews.productId, products.id), eq(productReviews.userId, userId)))
    .where(and(eq(entitlements.userId, userId), eq(orders.status, "PAID"), inArray(entitlements.status, ["ACTIVE", "EXPIRED"])))
    .groupBy(products.id, productReviews.id)
    .orderBy(desc(latestPurchase), products.name);
}

export async function saveStudentReview(userId: string, input: { productId: string; rating: number; comment: string; feedback: string | null }) {
  const result = await db.execute<{ id: string }>(sql`
    insert into ${productReviews} (product_id,user_id,rating,comment,feedback,status,moderation_note,moderated_by,moderated_at,created_at,updated_at)
    select ${input.productId}::uuid,${userId}::uuid,${input.rating},${input.comment},${input.feedback},'PENDING',null,null,null,now(),now()
    where exists (
      select 1 from ${entitlements} e
      join ${orders} o on o.id=e.order_id and o.status='PAID'
      where e.product_id=${input.productId}::uuid and e.user_id=${userId}::uuid and e.status in ('ACTIVE','EXPIRED')
    )
    on conflict(product_id,user_id) do update set
      rating=excluded.rating,comment=excluded.comment,feedback=excluded.feedback,status='PENDING',
      moderation_note=null,moderated_by=null,moderated_at=null,updated_at=now()
    returning id
  `);
  return result.rows[0];
}

export async function listManagedReviews() {
  return db.select({
    id: productReviews.id,
    rating: productReviews.rating,
    comment: productReviews.comment,
    feedback: productReviews.feedback,
    status: productReviews.status,
    moderationNote: productReviews.moderationNote,
    createdAt: productReviews.createdAt,
    updatedAt: productReviews.updatedAt,
    moderatedAt: productReviews.moderatedAt,
    productId: products.id,
    productName: products.name,
    productSlug: products.slug,
    studentId: users.id,
    studentName: users.name,
    studentEmail: users.email,
  }).from(productReviews)
    .innerJoin(products, eq(products.id, productReviews.productId))
    .innerJoin(users, eq(users.id, productReviews.userId))
    .orderBy(sql`case when ${productReviews.status}='PENDING' then 0 when ${productReviews.status}='REJECTED' then 1 else 2 end`, desc(productReviews.updatedAt));
}

export async function moderateReview(reviewId: string, adminId: string, input: { status: "APPROVED" | "REJECTED"; note: string | null }, requestId: string) {
  const result = await db.execute<{ id: string; status: "APPROVED" | "REJECTED" }>(sql`
    with target as (
      select id,status from ${productReviews}
      where id=${reviewId}::uuid
      for update
    ), updated as (
      update ${productReviews} pr set
        status=${input.status}::review_status,
        moderation_note=${input.note}::text,
        moderated_by=${adminId}::uuid,
        moderated_at=now(),
        updated_at=now()
      from target t
      where pr.id=t.id
      returning pr.id,pr.status,t.status as before_status
    ), logged as (
      insert into ${auditLogs} (actor_user_id,action,entity_type,entity_id,request_id,before,after)
      select ${adminId}::uuid,${`review.${input.status.toLowerCase()}`}::text,'product_review',u.id::text,${requestId}::text,
        jsonb_build_object('status',u.before_status),
        jsonb_build_object('status',u.status,'note',${input.note}::text)
      from updated u
      returning id
    )
    select u.id,u.status from updated u cross join logged
  `);
  return result.rows[0];
}
