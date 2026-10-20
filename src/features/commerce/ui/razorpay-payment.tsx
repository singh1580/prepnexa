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
  customer: { name: string; email: string; phone: string | null };
};
type PaymentState = "READY" | "PENDING" | "RETRYABLE" | "EXPIRED" | null;

export function RazorpayPayment({ checkout }: { checkout: Checkout }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>(null);

  async function confirm(response: CheckoutResponse) {
    try {
      const result = await commerceRequest<{ orderId: string }>("commerce/razorpay/confirm", { attemptId: checkout.attemptId, ...response });
      router.replace(`/payment-success?order=${result.orderId}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "We could not verify this payment. Check My Orders before trying again.");
      setBusy(false);
    }
  }

  async function checkPaymentStatus() {
    setChecking(true);
    setError("");
    setMessage("");
    try {
      const result = await commerceRequest<{ orderId: string; paid: boolean; state?: "CAPTURED" | "PENDING" | "READY" | "RETRYABLE" }>("commerce/razorpay/status", { attemptId: checkout.attemptId });
      if (result.paid) router.replace(`/payment-success?order=${result.orderId}`);
      else if(result.state==="PENDING"){setPaymentState("PENDING");setMessage("Payment confirmation is still pending. Please check the status again before making another payment.");}
      else if(result.state==="RETRYABLE"){setPaymentState("RETRYABLE");setMessage("The previous payment was not completed. Start a fresh payment attempt when you are ready.");}
      else{setPaymentState("READY");setMessage("Checkout was closed before a payment started. You can reopen this checkout safely.");}
    } catch (value) {
      setError(value instanceof Error ? value.message : "We could not check this payment yet. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  function openCheckout() {
    setError("");
    setMessage("");
    if (!window.Razorpay) {
      setError("Secure checkout is still loading. Please try again.");
      return;
    }
    const remainingSeconds = checkout.expiresAt ? Math.floor((new Date(checkout.expiresAt).getTime() - Date.now()) / 1000) : 900;
    if(remainingSeconds<=0){setPaymentState("EXPIRED");setError("This checkout has expired. Return to your cart and create a new order.");return;}
    setBusy(true);
    const instance = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      name: "Prepstore",
      image: new URL("/brand/prepstore-logo.svg", window.location.origin).toString(),
      description: `Order #${checkout.orderId.slice(0, 12).toUpperCase()}`,
      order_id: checkout.providerOrderId,
      prefill: { name: checkout.customer.name, email: checkout.customer.email, ...(checkout.customer.phone ? { contact: checkout.customer.phone } : {}) },
      readonly: { name: true, email: true, ...(checkout.customer.phone ? { contact: true } : {}) },
      theme: { color: "#e94b16", backdrop_color: "#fff7f2" },
      timeout: Math.min(900, remainingSeconds),
      retry: { enabled: true },
      modal: { confirm_close: true, ondismiss: () => { setBusy(false); void checkPaymentStatus(); } },
      handler: (response: CheckoutResponse) => { void confirm(response); },
    });
    instance.on("payment.failed", response => {
      setMessage(response.error?.description ?? "Payment failed. No package access was granted. Close checkout to start a fresh attempt.");
      setBusy(false);
    });
    instance.open();
  }

  async function retryPayment(){
    setChecking(true);setError("");setMessage("");
    try{
      const result=await commerceRequest<{paid:boolean;orderId:string;checkoutReference?:string}>("commerce/razorpay/retry",{attemptId:checkout.attemptId});
      if(result.paid)router.replace(`/payment-success?order=${result.orderId}`);
      else if(result.checkoutReference)router.replace(result.checkoutReference);
      else setError("A new payment attempt could not be opened. Please return to your order and try again.");
    }catch(value){setError(value instanceof Error?value.message:"We could not start a fresh payment attempt.");}
    finally{setChecking(false);}
  }

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setError("Secure checkout could not be loaded. Check your connection and try again.")}/>
    <section className="razorpay-payment-card" aria-labelledby="razorpay-heading">
      <span className="eyebrow">SECURE CHECKOUT</span>
      <div className="razorpay-lock" aria-hidden="true">▣</div>
      <h1 id="razorpay-heading">Complete your payment</h1>
      <p>Your order is ready. Payment is processed securely by Razorpay, and access is activated only after server verification.</p>
      <dl>
        <div><dt>Order</dt><dd>#{checkout.orderId.slice(0, 12).toUpperCase()}</dd></div>
        <div><dt>Amount payable</dt><dd>{formatMoney(checkout.amountPaise, checkout.currency)}</dd></div>
      </dl>
      <button className="reference-checkout-button" type="button" disabled={!scriptReady || busy || checking || paymentState==="PENDING" || paymentState==="RETRYABLE" || paymentState==="EXPIRED"} onClick={openCheckout}>{busy ? "Razorpay checkout open…" : scriptReady ? "Pay securely with Razorpay" : "Loading secure checkout…"}</button>
      {paymentState==="RETRYABLE"?<button className="reference-checkout-button" type="button" disabled={checking} onClick={retryPayment}>{checking?"Preparing fresh payment…":"Try payment again"}</button>:null}
      <button className="reference-outline-button razorpay-status-button" type="button" disabled={busy || checking} onClick={checkPaymentStatus}>{checking ? "Checking payment…" : "Check payment status"}</button>
      <small>Cards, UPI, netbanking and other enabled methods will appear inside Razorpay Checkout.</small>
      {error ? <p className="notice danger" role="alert">{error}</p> : null}
      {message ? <p className="notice" role="status">{message}</p> : null}
    </section>
  </>;
}
