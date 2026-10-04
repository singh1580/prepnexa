"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "../pricing";
import { commerceRequest } from "./api";

type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type FailureResponse = { error?: { description?: string } };
type RazorpayInstance = { open(): void; on(event: "payment.failed", callback: (response: FailureResponse) => void): void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global { interface Window { Razorpay?: RazorpayConstructor } }

type Checkout = {
  attemptId: string;
  orderId: string;
  providerOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  expiresAt: string | null;
  customer: { name: string; email: string };
};

export function RazorpayPayment({ checkout }: { checkout: Checkout }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm(response: CheckoutResponse) {
    try {
      const result = await commerceRequest<{ orderId: string }>("commerce/razorpay/confirm", { attemptId: checkout.attemptId, ...response });
      router.replace(`/payment-success?order=${result.orderId}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "We could not verify this payment. Check My Orders before trying again.");
      setBusy(false);
    }
  }

  function openCheckout() {
    setError("");
    if (!window.Razorpay) {
      setError("Secure checkout is still loading. Please try again.");
      return;
    }
    setBusy(true);
    const remainingSeconds = checkout.expiresAt ? Math.max(60, Math.floor((new Date(checkout.expiresAt).getTime() - Date.now()) / 1000)) : 900;
    const instance = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      name: "Prepstore",
      description: `Order #${checkout.orderId.slice(0, 12).toUpperCase()}`,
      order_id: checkout.providerOrderId,
      prefill: { name: checkout.customer.name, email: checkout.customer.email },
      readonly: { name: true, email: true },
      theme: { color: "#e94b16", backdrop_color: "#fff7f2" },
      timeout: Math.min(900, remainingSeconds),
      retry: { enabled: true },
      modal: { confirm_close: true, ondismiss: () => setBusy(false) },
      handler: (response: CheckoutResponse) => { void confirm(response); },
    });
    instance.on("payment.failed", response => {
      setError(response.error?.description ?? "Payment failed. No package access was granted.");
      setBusy(false);
    });
    instance.open();
  }

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} onError={() => setError("Secure checkout could not be loaded. Check your connection and try again.")}/>
    <section className="razorpay-payment-card" aria-labelledby="razorpay-heading">
      <span className="eyebrow">SECURE CHECKOUT</span>
      <div className="razorpay-lock" aria-hidden="true">▣</div>
      <h1 id="razorpay-heading">Complete your payment</h1>
      <p>Your order is ready. Payment is processed securely by Razorpay, and access is activated only after server verification.</p>
      <dl>
        <div><dt>Order</dt><dd>#{checkout.orderId.slice(0, 12).toUpperCase()}</dd></div>
        <div><dt>Amount payable</dt><dd>{formatMoney(checkout.amountPaise, checkout.currency)}</dd></div>
      </dl>
      <button className="reference-checkout-button" type="button" disabled={!scriptReady || busy} onClick={openCheckout}>{busy ? "Verifying payment…" : scriptReady ? "Pay securely with Razorpay" : "Loading secure checkout…"}</button>
      <small>Cards, UPI, netbanking and other enabled methods will appear inside Razorpay Checkout.</small>
      {error ? <p className="notice danger" role="alert">{error}</p> : null}
    </section>
  </>;
}
