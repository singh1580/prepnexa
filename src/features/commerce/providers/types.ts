export type ProviderCheckoutInput = {
  attemptId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  customer: { id: string; email: string; name: string };
  idempotencyKey: string;
  expiresAt: Date;
};

export type ProviderCheckout = {
  providerOrderId: string;
  checkoutReference: string;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
};

export type VerifiedPaymentEvent = {
  eventId: string;
  type: "PAYMENT_CAPTURED" | "PAYMENT_FAILED";
  providerOrderId: string;
  providerPaymentId: string | null;
  amountPaise: number;
  currency: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
};

export type ProviderRefundInput = {
  paymentId: string;
  providerPaymentId: string;
  amountPaise: number;
  currency: string;
  reason: string;
  idempotencyKey: string;
};

export type ProviderRefund = { providerRefundId: string; status: "SUCCEEDED" | "PROCESSING"; metadata?: Record<string, unknown> };

export interface PaymentProvider {
  readonly key: string;
  createCheckout(input: ProviderCheckoutInput): Promise<ProviderCheckout>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedPaymentEvent>;
  refund(input: ProviderRefundInput): Promise<ProviderRefund>;
}
