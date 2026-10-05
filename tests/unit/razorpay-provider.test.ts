import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/config/env";
import { razorpayPaymentProvider, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from "@/features/commerce/providers/razorpay";

beforeEach(() => {
  env.RAZORPAY_KEY_ID = "rzp_test_unit";
  env.RAZORPAY_KEY_SECRET = "unit-test-razorpay-secret";
});

afterEach(() => {
  env.RAZORPAY_KEY_ID = undefined;
  env.RAZORPAY_KEY_SECRET = undefined;
  vi.unstubAllGlobals();
});

describe("Razorpay signature verification", () => {
  it("accepts only the expected checkout signature", () => {
    const secret = "unit-test-razorpay-secret";
    const orderId = "order_Example123";
    const paymentId = "pay_Example456";
    const signature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    expect(verifyRazorpayPaymentSignature(orderId, paymentId, signature, secret)).toBe(true);
    expect(verifyRazorpayPaymentSignature(orderId, "pay_Other", signature, secret)).toBe(false);
  });

  it("verifies the webhook against the untouched raw body", () => {
    const secret = "unit-test-webhook-secret";
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyRazorpayWebhookSignature(`${body} `, signature, secret)).toBe(false);
  });

  it("creates a server-side Razorpay order without exposing the secret", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "order_Example123", amount: 11800, currency: "INR", status: "created" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", request);
    const checkout = await razorpayPaymentProvider.createCheckout({ attemptId: "11111111-1111-4111-8111-111111111111", orderId: "22222222-2222-4222-8222-222222222222", amountPaise: 11800, currency: "INR", customer: { id: "33333333-3333-4333-8333-333333333333", email: "student@example.com", name: "Student" }, idempotencyKey: "checkout:test", expiresAt: new Date("2030-01-01T00:00:00Z") });
    expect(checkout).toMatchObject({ providerOrderId: "order_Example123", checkoutReference: "/checkout/razorpay/11111111-1111-4111-8111-111111111111" });
    const [, init] = request.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({ amount: 11800, currency: "INR", notes: { prepstore_order_id: "22222222-2222-4222-8222-222222222222" } });
    expect(String(init.body)).not.toContain(env.RAZORPAY_KEY_SECRET!);
  });

  it("confirms only a captured payment returned by Razorpay", async () => {
    const orderId = "order_Example123";
    const paymentId = "pay_Example456";
    const signature = createHmac("sha256", env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: paymentId, order_id: orderId, amount: 11800, currency: "INR", status: "captured", captured: true, created_at: 1_800_000_000 }), { status: 200, headers: { "Content-Type": "application/json" } })));
    await expect(razorpayPaymentProvider.verifyPaymentConfirmation!({ providerOrderId: orderId, providerPaymentId: paymentId, signature })).resolves.toMatchObject({ type: "PAYMENT_CAPTURED", providerOrderId: orderId, providerPaymentId: paymentId, amountPaise: 11800 });
  });

  it("recovers a captured payment from its Razorpay order", async () => {
    const orderId = "order_Example123";
    const paymentId = "pay_Example456";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: paymentId, order_id: orderId, amount: 11800, currency: "INR", status: "captured", captured: true, created_at: 1_800_000_000 }] }), { status: 200, headers: { "Content-Type": "application/json" } })));
    await expect(razorpayPaymentProvider.reconcilePayment!(orderId)).resolves.toMatchObject({ type: "PAYMENT_CAPTURED", providerOrderId: orderId, providerPaymentId: paymentId, amountPaise: 11800 });
  });

  it("keeps an incomplete Razorpay order pending during reconciliation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: "pay_Pending", order_id: "order_Example123", amount: 11800, currency: "INR", status: "authorized", captured: false }] }), { status: 200, headers: { "Content-Type": "application/json" } })));
    await expect(razorpayPaymentProvider.reconcilePayment!("order_Example123")).resolves.toBeNull();
  });
});
