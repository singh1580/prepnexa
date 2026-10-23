import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, entitlements, orders, productReviews, products, users } from "@/db/schema";

export async function listReviewableProducts(userId: string) {
  return db.select({
    productId: products.id,
    slug: products.slug,
    name: products.name,
    purchasedAt: sql<Date | null>`max(${orders.paidAt})`,
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
    .orderBy(desc(orders.paidAt), products.name);
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
  return db.transaction(async tx => {
    const before = await tx.query.productReviews.findFirst({ where: eq(productReviews.id, reviewId) });
    if (!before) return undefined;
    const [updated] = await tx.update(productReviews).set({ status: input.status, moderationNote: input.note, moderatedBy: adminId, moderatedAt: new Date(), updatedAt: new Date() }).where(eq(productReviews.id, reviewId)).returning();
    await tx.insert(auditLogs).values({ actorUserId: adminId, action: `review.${input.status.toLowerCase()}`, entityType: "product_review", entityId: reviewId, requestId, before: { status: before.status }, after: { status: input.status, note: input.note } });
    return updated;
  });
}
