"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "../pricing";
import { commerceRequest } from "./api";

type CheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type FailureResponse = { error?: { description?: string } };
type RazorpayInstance = {
  open(): void;
  on(
    event: "payment.failed",
    callback: (response: FailureResponse) => void,
  ): void;
};
type RazorpayConstructor = new (
  options: Record<string, unknown>,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

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
const primaryButton =
  "mt-[.65rem] flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-prep-orange px-4 py-[.7rem] text-[.8rem] font-[760] text-white hover:border-prep-orange-dark hover:bg-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-55";
const outlineButton =
  "mt-[.65rem] flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-white px-4 py-[.7rem] text-[.8rem] font-[760] text-prep-orange hover:bg-prep-orange-soft disabled:cursor-not-allowed disabled:opacity-55";

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
      const result = await commerceRequest<{ orderId: string }>(
        "commerce/razorpay/confirm",
        { attemptId: checkout.attemptId, ...response },
      );
      router.replace(`/payment-success?order=${result.orderId}`);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "We could not verify this payment. Check My Orders before trying again.",
      );
      setBusy(false);
    }
  }

  async function checkPaymentStatus() {
    setChecking(true);
    setError("");
    setMessage("");
    try {
      const result = await commerceRequest<{
        orderId: string;
        paid: boolean;
        state?: "CAPTURED" | "PENDING" | "READY" | "RETRYABLE";
      }>("commerce/razorpay/status", { attemptId: checkout.attemptId });
      if (result.paid)
        router.replace(`/payment-success?order=${result.orderId}`);
      else if (result.state === "PENDING") {
        setPaymentState("PENDING");
        setMessage(
          "Payment confirmation is still pending. Please check the status again before making another payment.",
        );
      } else if (result.state === "RETRYABLE") {
        setPaymentState("RETRYABLE");
        setMessage(
          "The previous payment was not completed. Start a fresh payment attempt when you are ready.",
        );
      } else {
        setPaymentState("READY");
        setMessage(
          "Checkout was closed before a payment started. You can reopen this checkout safely.",
        );
      }
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "We could not check this payment yet. Please try again.",
      );
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
    const remainingSeconds = checkout.expiresAt
      ? Math.floor((new Date(checkout.expiresAt).getTime() - Date.now()) / 1000)
      : 900;
    if (remainingSeconds <= 0) {
      setPaymentState("EXPIRED");
      setError(
        "This checkout has expired. Return to your cart and create a new order.",
      );
      return;
    }
    setBusy(true);
    const instance = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      name: "Prepstore",
      image: new URL(
        "/brand/prepstore-logo.svg",
        window.location.origin,
      ).toString(),
      description: `Order #${checkout.orderId.slice(0, 12).toUpperCase()}`,
      order_id: checkout.providerOrderId,
      prefill: {
        name: checkout.customer.name,
        email: checkout.customer.email,
        ...(checkout.customer.phone
          ? { contact: checkout.customer.phone }
          : {}),
      },
      readonly: {
        name: true,
        email: true,
        ...(checkout.customer.phone ? { contact: true } : {}),
      },
      theme: { color: "#e94b16", backdrop_color: "#fff7f2" },
      timeout: Math.min(900, remainingSeconds),
      retry: { enabled: true },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setBusy(false);
          void checkPaymentStatus();
        },
      },
      handler: (response: CheckoutResponse) => {
        void confirm(response);
      },
    });
    instance.on("payment.failed", (response) => {
      setMessage(
        response.error?.description ??
          "Payment failed. No package access was granted. Close checkout to start a fresh attempt.",
      );
      setBusy(false);
    });
    instance.open();
  }

  async function retryPayment() {
    setChecking(true);
    setError("");
    setMessage("");
    try {
      const result = await commerceRequest<{
        paid: boolean;
        orderId: string;
        checkoutReference?: string;
      }>("commerce/razorpay/retry", { attemptId: checkout.attemptId });
      if (result.paid)
        router.replace(`/payment-success?order=${result.orderId}`);
      else if (result.checkoutReference)
        router.replace(result.checkoutReference);
      else
        setError(
          "A new payment attempt could not be opened. Please return to your order and try again.",
        );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "We could not start a fresh payment attempt.",
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() =>
          setError(
            "Secure checkout could not be loaded. Check your connection and try again.",
          )
        }
      />
      <section
        className="mx-auto my-[clamp(1.25rem,5vw,4rem)] w-[min(100%,34rem)] rounded-xl border border-[#e3e0dc] bg-white p-[clamp(1.25rem,4vw,2rem)] shadow-[0_1.25rem_3.5rem_rgba(45,35,29,.08)] max-[560px]:my-4"
        aria-labelledby="razorpay-heading"
      >
        <span className="text-[.68rem] font-extrabold tracking-[.18em] text-prep-orange">
          SECURE CHECKOUT
        </span>
        <div
          className="mt-4 grid size-10 place-items-center rounded-full bg-[#fff0e8] text-prep-orange"
          aria-hidden="true"
        >
          ▣
        </div>
        <h1
          className="my-[.55rem] text-[clamp(1.8rem,5vw,2.5rem)] tracking-[-.045em]"
          id="razorpay-heading"
        >
          Complete your payment
        </h1>
        <p className="leading-[1.6] text-[#687077]">
          Your order is ready. Payment is processed securely by Razorpay, and
          access is activated only after server verification.
        </p>
        <dl className="my-5">
          <div className="flex justify-between gap-4 border-t border-[#ece9e5] py-[.8rem] max-[560px]:flex-col max-[560px]:gap-1">
            <dt>Order</dt>
            <dd className="m-0 text-right font-[760] [overflow-wrap:anywhere] max-[560px]:text-left">
              #{checkout.orderId.slice(0, 12).toUpperCase()}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-[#ece9e5] py-[.8rem] max-[560px]:flex-col max-[560px]:gap-1">
            <dt>Amount payable</dt>
            <dd className="m-0 text-right font-[760] [overflow-wrap:anywhere] max-[560px]:text-left">
              {formatMoney(checkout.amountPaise, checkout.currency)}
            </dd>
          </div>
        </dl>
        <button
          className={primaryButton}
          type="button"
          disabled={
            !scriptReady ||
            busy ||
            checking ||
            paymentState === "PENDING" ||
            paymentState === "RETRYABLE" ||
            paymentState === "EXPIRED"
          }
          onClick={openCheckout}
        >
          {busy
            ? "Razorpay checkout open…"
            : scriptReady
              ? "Pay securely with Razorpay"
              : "Loading secure checkout…"}
        </button>
        {paymentState === "RETRYABLE" ? (
          <button
            className={primaryButton}
            type="button"
            disabled={checking}
            onClick={retryPayment}
          >
            {checking ? "Preparing fresh payment…" : "Try payment again"}
          </button>
        ) : null}
        <button
          className={outlineButton}
          type="button"
          disabled={busy || checking}
          onClick={checkPaymentStatus}
        >
          {checking ? "Checking payment…" : "Check payment status"}
        </button>
        <small className="mt-4 block leading-normal text-prep-muted">
          Cards, UPI, netbanking and other enabled methods will appear inside
          Razorpay Checkout.
        </small>
        {error ? (
          <p
            className="mt-4 rounded-[.6rem] border border-[#dfb6b2] bg-[#fbf3f2] px-4 py-[.85rem] leading-6 text-[#8c332f]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            className="mt-4 rounded-[.6rem] border border-[#e2d9d0] bg-[#fffcf8] px-4 py-[.85rem] leading-6 text-[#333]"
            role="status"
          >
            {message}
          </p>
        ) : null}
      </section>
    </>
  );
}
