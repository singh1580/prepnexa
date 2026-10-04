import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";
import { paymentUnavailable, paymentVerificationFailed } from "../errors";
import type { PaymentProvider, ProviderCheckoutInput, ProviderPaymentConfirmation, ProviderRefundInput, VerifiedPaymentEvent } from "./types";

type RazorpayOrder = { id?: unknown; amount?: unknown; currency?: unknown; status?: unknown };
type RazorpayPayment = { id?: unknown; order_id?: unknown; amount?: unknown; currency?: unknown; status?: unknown; captured?: unknown; created_at?: unknown; error_code?: unknown };
type RazorpayRefund = { id?: unknown; status?: unknown };

function credentials() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw paymentUnavailable("Razorpay credentials are not configured.");
  return { keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET };
}

function secureMatch(value: string, expected: string) {
  const left = Buffer.from(value, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return secureMatch(signature, expected);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return secureMatch(signature, expected);
}

async function requestRazorpay<T>(path: string, init: RequestInit = {}) {
  const { keyId, keySecret } = credentials();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw paymentUnavailable("Razorpay could not be reached. Please try again.");
  }
  const body = await response.json().catch(() => null) as T | null;
  if (!response.ok || !body) throw paymentUnavailable("Razorpay could not complete this request.");
  return body;
}

function paymentEvent(payment: RazorpayPayment, type: VerifiedPaymentEvent["type"], eventId: string, payload: Record<string, unknown>): VerifiedPaymentEvent {
  if (typeof payment.id !== "string" || typeof payment.order_id !== "string" || typeof payment.amount !== "number" || !Number.isSafeInteger(payment.amount) || typeof payment.currency !== "string") throw paymentVerificationFailed();
  return {
    eventId,
    type,
    providerOrderId: payment.order_id,
    providerPaymentId: payment.id,
    amountPaise: payment.amount,
    currency: payment.currency.toUpperCase(),
    occurredAt: typeof payment.created_at === "number" ? new Date(payment.created_at * 1000) : new Date(),
    payload,
  };
}

export const razorpayPaymentProvider: PaymentProvider = {
  key: "razorpay",
  async createCheckout(input: ProviderCheckoutInput) {
    if (input.currency.toUpperCase() !== "INR") throw paymentUnavailable("Razorpay checkout currently supports INR orders only.");
    const order = await requestRazorpay<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency.toUpperCase(),
        receipt: `ps_${input.orderId.replaceAll("-", "")}`.slice(0, 40),
        notes: { prepstore_order_id: input.orderId, payment_attempt_id: input.attemptId, customer_id: input.customer.id },
      }),
    });
    if (typeof order.id !== "string" || order.amount !== input.amountPaise || order.currency !== input.currency.toUpperCase()) throw paymentVerificationFailed("Razorpay returned an invalid order.");
    return {
      providerOrderId: order.id,
      checkoutReference: `/checkout/razorpay/${input.attemptId}`,
      expiresAt: input.expiresAt,
      metadata: { razorpayOrderStatus: order.status ?? "created" },
    };
  },
  async verifyPaymentConfirmation(input: ProviderPaymentConfirmation) {
    const { keySecret } = credentials();
    if (!verifyRazorpayPaymentSignature(input.providerOrderId, input.providerPaymentId, input.signature, keySecret)) throw paymentVerificationFailed();
    const payment = await requestRazorpay<RazorpayPayment>(`/payments/${encodeURIComponent(input.providerPaymentId)}`);
    if (payment.order_id !== input.providerOrderId || payment.status !== "captured" || payment.captured !== true) throw paymentVerificationFailed("The payment has not been captured.");
    return paymentEvent(payment, "PAYMENT_CAPTURED", `checkout:${input.providerPaymentId}`, { source: "razorpay-checkout-confirmation", payment });
  },
  async verifyWebhook(rawBody: string, headers: Headers) {
    const signature = headers.get("x-razorpay-signature") ?? "";
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature || !verifyRazorpayWebhookSignature(rawBody, signature, secret)) throw paymentVerificationFailed();
    const payload = JSON.parse(rawBody) as Record<string, unknown> & { event?: unknown; created_at?: unknown; payload?: { payment?: { entity?: RazorpayPayment } } };
    const event = payload.event;
    if (event !== "payment.captured" && event !== "payment.failed") throw paymentVerificationFailed("Unsupported Razorpay event.");
    const payment = payload.payload?.payment?.entity;
    if (!payment) throw paymentVerificationFailed();
    const eventId = headers.get("x-razorpay-event-id") ?? createHash("sha256").update(rawBody).digest("hex");
    return paymentEvent(payment, event === "payment.captured" ? "PAYMENT_CAPTURED" : "PAYMENT_FAILED", eventId, payload);
  },
  async refund(input: ProviderRefundInput) {
    const refund = await requestRazorpay<RazorpayRefund>(`/payments/${encodeURIComponent(input.providerPaymentId)}/refund`, {
      method: "POST",
      headers: { "X-Razorpay-Idempotency-Key": input.idempotencyKey },
      body: JSON.stringify({ amount: input.amountPaise, notes: { reason: input.reason.slice(0, 240), prepstore_payment_id: input.paymentId } }),
    });
    if (typeof refund.id !== "string" || typeof refund.status !== "string") throw paymentUnavailable("Razorpay returned an invalid refund.");
    if (!["processed", "pending"].includes(refund.status)) throw paymentUnavailable("Razorpay did not accept this refund.");
    return { providerRefundId: refund.id, status: refund.status === "processed" ? "SUCCEEDED" : "PROCESSING", metadata: { razorpayStatus: refund.status } };
  },
};
