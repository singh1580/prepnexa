import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const run=process.env.RUN_COMMERCE_INTEGRATION==="true";
const timeout=Number(process.env.INTEGRATION_TIMEOUT_MS??60_000);
const adminId=randomUUID();const studentId=randomUUID();const secondStudentId=randomUUID();
const productId=randomUUID();const freeProductId=randomUUID();const code=`QA${randomUUID().replaceAll("-","").slice(0,12).toUpperCase()}`;
const email=`commerce-${randomUUID()}@example.com`;
let couponId:string|undefined;let orderId:string|undefined;let freeOrderId:string|undefined;let paymentId:string|undefined;let paymentAttemptId:string|undefined;

describe.skipIf(!run)("provider-neutral commerce flow",()=>{
  afterAll(async()=>{const[{db},schema,{eq,inArray,or}]=await Promise.all([import("../../src/db/client"),import("../../src/db/schema"),import("drizzle-orm")]);
    if(orderId){const paymentRows=await db.select({id:schema.payments.id}).from(schema.payments).where(eq(schema.payments.orderId,orderId));const ids=paymentRows.map(row=>row.id);if(ids.length)await db.delete(schema.refunds).where(inArray(schema.refunds.paymentId,ids));await db.delete(schema.entitlements).where(eq(schema.entitlements.orderId,orderId));await db.delete(schema.couponRedemptions).where(eq(schema.couponRedemptions.orderId,orderId));await db.delete(schema.payments).where(eq(schema.payments.orderId,orderId));await db.delete(schema.orders).where(eq(schema.orders.id,orderId));}
    if(freeOrderId){await db.delete(schema.entitlements).where(eq(schema.entitlements.orderId,freeOrderId));await db.delete(schema.orders).where(eq(schema.orders.id,freeOrderId));}
    if(couponId)await db.delete(schema.coupons).where(eq(schema.coupons.id,couponId));
    await db.delete(schema.products).where(inArray(schema.products.id,[productId,freeProductId]));
    if(paymentAttemptId)await db.delete(schema.webhookEvents).where(eq(schema.webhookEvents.providerEventId,`mock-capture:${paymentAttemptId}`));
    await db.delete(schema.auditLogs).where(or(eq(schema.auditLogs.actorUserId,adminId),eq(schema.auditLogs.actorUserId,studentId),eq(schema.auditLogs.actorUserId,secondStudentId)));
    await db.delete(schema.users).where(inArray(schema.users.id,[adminId,studentId,secondStudentId]));
  },timeout*2);

  it("reserves a coupon, captures once, grants access, refunds and completes a free order",async()=>{const[{db},schema,commerce,{eq}]=await Promise.all([import("../../src/db/client"),import("../../src/db/schema"),import("../../src/features/commerce/service"),import("drizzle-orm")]);
    await db.insert(schema.users).values([{id:adminId,email:`admin-${email}`,name:"QA Admin",passwordHash:"integration",status:"ACTIVE",emailVerifiedAt:new Date()},{id:studentId,email,name:"QA Student",passwordHash:"integration",status:"ACTIVE",emailVerifiedAt:new Date()},{id:secondStudentId,email:`second-${email}`,name:"QA Student Two",passwordHash:"integration",status:"ACTIVE",emailVerifiedAt:new Date()}]);
    await db.insert(schema.products).values([{id:productId,slug:`paid-${productId}`,name:"QA Quant Pack",description:"QA only",pricePaise:20_000,currency:"INR",accessDays:30,status:"PUBLISHED"},{id:freeProductId,slug:`free-${freeProductId}`,name:"QA Free Pack",description:"QA only",pricePaise:0,currency:"INR",accessDays:7,status:"PUBLISHED"}]);
    couponId=(await commerce.createCoupon({code,type:"PERCENT",value:2500,currency:"INR",maxDiscountPaise:4_000,minOrderPaise:10_000,totalLimit:1,perUserLimit:1,startsAt:null,endsAt:null,active:true,productIds:[productId]},{userId:adminId,requestId:randomUUID()})).id;
    const student={userId:studentId,email,name:"QA Student",requestId:randomUUID()};const idempotencyKey=randomUUID();
    const checkout=await commerce.createCheckout({productId,couponCode:code,idempotencyKey},student);orderId=checkout.id;paymentAttemptId=checkout.paymentAttemptId??undefined;
    expect(checkout).toMatchObject({subtotalPaise:20_000,discountPaise:4_000,totalPaise:16_000,paymentRequired:true,provider:"mock"});
    const repeated=await commerce.createCheckout({productId,couponCode:code,idempotencyKey},{...student,requestId:randomUUID()});expect(repeated.id).toBe(orderId);
    await expect(commerce.previewCheckout(productId,code,secondStudentId)).rejects.toMatchObject({code:"COUPON_UNAVAILABLE",status:409});
    const first=await commerce.confirmMockPayment(checkout.paymentAttemptId!,{...student,requestId:randomUUID()});const duplicate=await commerce.confirmMockPayment(checkout.paymentAttemptId!,{...student,requestId:randomUUID()});expect(first.duplicate).toBe(false);expect(duplicate.duplicate).toBe(true);
    const [order]=await db.select().from(schema.orders).where(eq(schema.orders.id,orderId));expect(order.status).toBe("PAID");
    const paymentRows=await db.select().from(schema.payments).where(eq(schema.payments.orderId,orderId));expect(paymentRows).toHaveLength(1);paymentId=paymentRows[0]!.id;
    const access=await db.select().from(schema.entitlements).where(eq(schema.entitlements.orderId,orderId));expect(access).toHaveLength(1);expect(access[0]!.status).toBe("ACTIVE");
    const partialRefundKey=randomUUID();
    const partial=await commerce.refundPayment(paymentId,{amountPaise:6_000,reason:"QA partial refund",revokeAccess:false,idempotencyKey:partialRefundKey},{userId:adminId,requestId:randomUUID()});
    const repeatedPartial=await commerce.refundPayment(paymentId,{amountPaise:6_000,reason:"QA partial refund",revokeAccess:false,idempotencyKey:partialRefundKey},{userId:adminId,requestId:randomUUID()});expect(repeatedPartial.id).toBe(partial.id);
    await commerce.refundPayment(paymentId,{amountPaise:10_000,reason:"QA final refund",revokeAccess:true,idempotencyKey:randomUUID()},{userId:adminId,requestId:randomUUID()});
    const [refundedOrder]=await db.select().from(schema.orders).where(eq(schema.orders.id,orderId));expect(refundedOrder.status).toBe("REFUNDED");
    const [refundedAccess]=await db.select().from(schema.entitlements).where(eq(schema.entitlements.orderId,orderId));expect(refundedAccess.status).toBe("REFUNDED");
    const free=await commerce.createCheckout({productId:freeProductId,couponCode:null,idempotencyKey:randomUUID()},{...student,requestId:randomUUID()});freeOrderId=free.id;expect(free).toMatchObject({status:"PAID",paymentRequired:false,totalPaise:0});
    expect(await db.select().from(schema.entitlements).where(eq(schema.entitlements.orderId,freeOrderId))).toHaveLength(1);
  },timeout*8);
});
