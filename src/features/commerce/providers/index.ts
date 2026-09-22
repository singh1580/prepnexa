import { env } from "@/config/env";
import { paymentUnavailable } from "../errors";
import { mockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";

const providers: Record<string, PaymentProvider> = { mock: mockPaymentProvider };

export function getPaymentProvider(key = env.PAYMENT_PROVIDER.toLowerCase()) {
  const provider = providers[key];
  if (!provider) throw paymentUnavailable(`Payment provider '${key}' is not configured.`);
  if (provider.key === "mock" && env.NODE_ENV === "production") throw paymentUnavailable("A production payment provider has not been configured.");
  return provider;
}

export type { PaymentProvider, ProviderCheckout, ProviderCheckoutInput, ProviderRefund, ProviderRefundInput, VerifiedPaymentEvent } from "./types";
