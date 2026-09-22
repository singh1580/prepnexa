import { createHash } from "node:crypto";
import { logger } from "@/lib/logger";
import { calculateDiscount, normalizeCouponCode } from "./pricing";
import { checkoutConflict, commerceNotFound, couponUnavailable, invalidCommerceState, paymentUnavailable, paymentVerificationFailed } from "./errors";
import { evaluateCoupon, failPaymentAttempt, finalizeFreeOrder, findCheckoutProduct, findManagedCoupon, findOrderByIdempotency, findProviderAttempt, findRefundByIdempotency, findRefundTarget, findStudentPaymentAttempt, insertCheckoutOrder, insertCoupon, insertPaymentAttempt, listCouponProducts, listManagedCoupons, listManagedOrders, listStudentOrders, processPaymentEvent, releaseExpiredCommerce, saveProviderCheckout, saveRefund, setCouponActiveRecord, updateCouponRecord } from "./repository";
import { getPaymentProvider, type VerifiedPaymentEvent } from "./providers";
import type { CheckoutInput, CouponInput, RefundInput } from "./validation";
import { queueStudentNotification } from "@/features/operations/service";

type Actor = { userId: string; requestId: string };
type StudentActor = Actor & { email: string; name: string };

function databaseCode(error: unknown) {
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i += 1) {
    if (typeof current === "object" && "code" in current && typeof current.code === "string") return current.code;
    current = typeof current === "object" && "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

export const getManagedCoupons = () => listManagedCoupons();
export const getCouponProducts = () => listCouponProducts();
export async function getManagedCoupon(id: string) {
  const coupon = await findManagedCoupon(id);
  if (!coupon) throw commerceNotFound("Coupon");
  return coupon;
}

export async function createCoupon(input: CouponInput, actor: Actor) {
  try {
    const result = await insertCoupon(input, { actorUserId: actor.userId, requestId: actor.requestId });
    logger.info({ requestId: actor.requestId, module: "commerce", action: "coupon_create", actorUserId: actor.userId }, "Coupon created");
    return result;
  } catch (error) {
    if (databaseCode(error) === "23505") throw checkoutConflict("A coupon with this code already exists.");
    throw error;
  }
}

export async function updateCoupon(id: string, input: CouponInput, actor: Actor) {
  try {
    const result = await updateCouponRecord(id, input, { actorUserId: actor.userId, requestId: actor.requestId });
    if (!result) throw commerceNotFound("Coupon");
    return result;
  } catch (error) {
    if (databaseCode(error) === "23505") throw checkoutConflict("A coupon with this code already exists.");
    throw error;
  }
}

export async function setCouponActive(id: string, active: boolean, actor: Actor) {
  const result = await setCouponActiveRecord(id, active, { actorUserId: actor.userId, requestId: actor.requestId });
  if (!result) throw commerceNotFound("Coupon");
  return result;
}

async function priceCheckout(productId: string, couponCode: string | null, userId: string) {
  const product = await findCheckoutProduct(productId, userId);
  if (!product) throw commerceNotFound("Published product");
  if (product.alreadyOwned) throw checkoutConflict("You already have active access to this product.");
  if (!couponCode) return { product, coupon: null, discountPaise: 0, totalPaise: product.pricePaise };
  const code = normalizeCouponCode(couponCode);
  const coupon = await evaluateCoupon(code, product.id, userId, product.pricePaise, product.currency);
  if (!coupon || coupon.totalLimit !== null && coupon.totalUsed >= coupon.totalLimit || coupon.userUsed >= coupon.perUserLimit) throw couponUnavailable();
  const discountPaise = calculateDiscount(product.pricePaise, coupon);
  if (discountPaise <= 0) throw couponUnavailable("This coupon does not reduce the price of this product.");
  return { product, coupon, discountPaise, totalPaise: product.pricePaise - discountPaise };
}

export async function previewCheckout(productId: string, couponCode: string | null, userId: string) {
  await releaseExpiredCommerce();
  const priced = await priceCheckout(productId, couponCode, userId);
  return { product: priced.product, couponCode: priced.coupon?.code ?? null, subtotalPaise: priced.product.pricePaise, discountPaise: priced.discountPaise, totalPaise: priced.totalPaise, currency: priced.product.currency };
}

async function startProviderCheckout(order: NonNullable<Awaited<ReturnType<typeof findOrderByIdempotency>>>, student: StudentActor) {
  if (order.totalPaise <= 0) {
    await finalizeFreeOrder(order.id, student.userId, student.requestId);
    await queueStudentNotification({ userId: student.userId, type: "PURCHASE_CONFIRMED", deduplicationKey: `order-paid:${order.id}`, title: "Access is ready", body: "Your order is complete and the included tests and materials are available.", requestId: student.requestId });
    return { ...order, status: "PAID", paymentRequired: false, checkoutReference: null };
  }
  if (order.checkoutReference && order.paymentAttemptId) return { ...order, paymentRequired: true };
  const provider = getPaymentProvider();
  const attempt = await insertPaymentAttempt({ orderId: order.id, provider: provider.key, idempotencyKey: `checkout:${order.id}:1`, amountPaise: order.totalPaise, currency: order.currency, expiresAt: new Date(order.expiresAt) });
  if (!attempt) throw paymentUnavailable();
  try {
    const checkout = await provider.createCheckout({ attemptId: attempt.id, orderId: order.id, amountPaise: order.totalPaise, currency: order.currency, customer: { id: student.userId, email: student.email, name: student.name }, idempotencyKey: attempt.idempotencyKey, expiresAt: new Date(order.expiresAt) });
    const saved = await saveProviderCheckout(attempt.id, checkout);
    return { ...order, paymentAttemptId: attempt.id, provider: provider.key, checkoutReference: saved?.checkoutReference ?? checkout.checkoutReference, paymentRequired: true };
  } catch (error) {
    await failPaymentAttempt(attempt.id, "PROVIDER_CREATE_FAILED");
    logger.error({ requestId: student.requestId, module: "commerce", action: "checkout_provider_failed", provider: provider.key, orderId: order.id, errorType: error instanceof Error ? error.name : "UnknownError" }, "Provider checkout creation failed");
    throw paymentUnavailable();
  }
}

export async function createCheckout(input: CheckoutInput, student: StudentActor) {
  await releaseExpiredCommerce();
  const scopedKey = `${student.userId}:${input.idempotencyKey}`.slice(0, 100);
  const existing = await findOrderByIdempotency(student.userId, scopedKey);
  if (existing) return startProviderCheckout(existing, student);
  const priced = await priceCheckout(input.productId, input.couponCode, student.userId);
  const created = await insertCheckoutOrder({ userId: student.userId, productId: input.productId, idempotencyKey: scopedKey, couponId: priced.coupon?.id ?? null, couponCode: priced.coupon?.code ?? null, requestId: student.requestId });
  if (!created) {
    const raced = await findOrderByIdempotency(student.userId, scopedKey);
    if (raced) return startProviderCheckout(raced, student);
    throw priced.coupon ? couponUnavailable("This coupon became unavailable. Review the price and try again.") : checkoutConflict("This product is no longer available for checkout.");
  }
  logger.info({ requestId: student.requestId, module: "commerce", action: "order_create", actorUserId: student.userId, orderId: created.id }, "Checkout order created");
  return startProviderCheckout(created, student);
}

export async function handlePaymentWebhook(providerKey: string, rawBody: string, headers: Headers, requestId: string) {
  const provider = getPaymentProvider(providerKey);
  const event = await provider.verifyWebhook(rawBody, headers);
  if (event.type === "PAYMENT_CAPTURED" && !event.providerPaymentId) throw paymentVerificationFailed();
  const target = await findProviderAttempt(provider.key, event.providerOrderId);
  if (!target || target.amountPaise !== event.amountPaise || target.currency !== event.currency) throw paymentVerificationFailed();
  const result = await processPaymentEvent(provider.key, event, requestId);
  if (!result) throw invalidCommerceState("The payment event could not be applied to this order.");
  if (!result.duplicate) await queueStudentNotification({ userId: target.userId, type: event.type === "PAYMENT_CAPTURED" ? "PURCHASE_CONFIRMED" : "PAYMENT_FAILED", deduplicationKey: `${event.type === "PAYMENT_CAPTURED" ? "order-paid" : "order-failed"}:${result.orderId}`, title: event.type === "PAYMENT_CAPTURED" ? "Payment confirmed" : "Payment failed", body: event.type === "PAYMENT_CAPTURED" ? "Your payment is confirmed and purchased access is active." : "Your payment was not completed. No access was granted.", requestId });
  logger.info({ requestId, module: "commerce", action: event.type.toLowerCase(), provider: provider.key, orderId: result.orderId, duplicate: result.duplicate }, "Payment webhook processed");
  return result;
}

export async function confirmMockPayment(attemptId: string, student: StudentActor) {
  const attempt = await findStudentPaymentAttempt(attemptId, student.userId);
  if (!attempt) throw commerceNotFound("Payment attempt");
  if (attempt.provider !== "mock" || !attempt.providerOrderId) throw invalidCommerceState("This payment cannot be confirmed with the test provider.");
  const event: VerifiedPaymentEvent = { eventId: `mock-capture:${attempt.attemptId}`, type: "PAYMENT_CAPTURED", providerOrderId: attempt.providerOrderId, providerPaymentId: `mock_payment_${attempt.attemptId}`, amountPaise: attempt.amountPaise, currency: attempt.currency, occurredAt: new Date(), payload: { source: "authenticated-mock-confirmation", attemptId: attempt.attemptId } };
  const result = await processPaymentEvent("mock", event, student.requestId);
  if (!result) throw invalidCommerceState("The test payment could not be completed.");
  if (!result.duplicate) await queueStudentNotification({ userId: student.userId, type: "PURCHASE_CONFIRMED", deduplicationKey: `order-paid:${result.orderId}`, title: "Payment confirmed", body: "Your payment is confirmed and purchased access is active.", requestId: student.requestId });
  return result;
}

export async function getStudentOrders(userId: string) { await releaseExpiredCommerce(); return listStudentOrders(userId); }
export async function getManagedOrders() { await releaseExpiredCommerce(); return listManagedOrders(); }

export async function refundPayment(paymentId: string, input: RefundInput, actor: Actor) {
  const scopedKey = createHash("sha256").update(`${paymentId}:${input.idempotencyKey}`).digest("hex");
  const existing = await findRefundByIdempotency(paymentId, scopedKey);
  if (existing) return existing;
  const target = await findRefundTarget(paymentId);
  if (!target || !target.providerPaymentId) throw commerceNotFound("Captured payment");
  if (input.amountPaise > target.amountPaise - target.refundedPaise) throw invalidCommerceState("Refund amount exceeds the remaining captured amount.");
  const provider = getPaymentProvider(target.provider);
  const providerResult = await provider.refund({ paymentId: target.id, providerPaymentId: target.providerPaymentId, amountPaise: input.amountPaise, currency: target.currency, reason: input.reason, idempotencyKey: scopedKey });
  const result = await saveRefund({ paymentId: target.id, provider: provider.key, providerRefundId: providerResult.providerRefundId, idempotencyKey: scopedKey, amountPaise: input.amountPaise, reason: input.reason, revokeAccess: input.revokeAccess, requestedBy: actor.userId, status: providerResult.status, requestId: actor.requestId });
  if (!result) throw invalidCommerceState("This refund was already processed or exceeds the available amount.");
  return result;
}
