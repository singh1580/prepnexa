import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";
import { paymentVerificationFailed } from "../errors";
import type { PaymentProvider, ProviderCheckoutInput, ProviderRefundInput, VerifiedPaymentEvent } from "./types";

function verifyMockSignature(body: string, signature: string) {
  const secret = env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return env.NODE_ENV !== "production";
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export const mockPaymentProvider: PaymentProvider = {
  key: "mock",
  async createCheckout(input: ProviderCheckoutInput) {
    if (env.NODE_ENV === "production") throw new Error("The mock payment provider is disabled in production.");
    return {
      providerOrderId: `mock_order_${input.attemptId}`,
      checkoutReference: `/checkout/mock/${input.attemptId}`,
      expiresAt: input.expiresAt,
      metadata: { mode: "test", orderId: input.orderId },
    };
  },
  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedPaymentEvent> {
    if (!verifyMockSignature(rawBody, headers.get("x-mock-signature") ?? "")) throw paymentVerificationFailed();
    const value = JSON.parse(rawBody) as Partial<VerifiedPaymentEvent> & { occurredAt?: string | Date };
    const amountPaise = value.amountPaise;
    const type = value.type;
    if (!value.eventId || !value.providerOrderId || type !== "PAYMENT_CAPTURED" && type !== "PAYMENT_FAILED" || typeof amountPaise !== "number" || !Number.isSafeInteger(amountPaise) || !value.currency) throw paymentVerificationFailed();
    return {
      eventId: value.eventId,
      type,
      providerOrderId: value.providerOrderId,
      providerPaymentId: value.providerPaymentId ?? null,
      amountPaise,
      currency: value.currency,
      occurredAt: value.occurredAt ? new Date(value.occurredAt) : new Date(),
      payload: JSON.parse(rawBody) as Record<string, unknown>,
    };
  },
  async refund(input: ProviderRefundInput) {
    if (env.NODE_ENV === "production") throw new Error("The mock payment provider is disabled in production.");
    return { providerRefundId: `mock_refund_${input.idempotencyKey}`, status: "SUCCEEDED", metadata: { mode: "test" } };
  },
};
