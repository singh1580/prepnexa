"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { commerceRequest } from "./api";

export function MockPayment({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await commerceRequest<{ orderId: string }>(
        "commerce/mock/confirm",
        { attemptId },
      );
      router.push(`/payment-success?order=${result.orderId}`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Payment failed.");
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto mt-12 max-w-[35rem] rounded-[.85rem] border border-[var(--line)] bg-white p-8 shadow-[0_.6rem_2rem_#3a2b2108] max-[600px]:mt-4 max-[600px]:p-5">
      <span className="text-[.68rem] font-extrabold tracking-[.18em] text-[var(--teal)]">
        TEST PAYMENT PROVIDER
      </span>
      <h1 className="my-3 text-[clamp(1.8rem,5vw,2.5rem)]">
        Complete a mock payment
      </h1>
      <p className="leading-[1.6] text-[var(--muted)]">
        No real money will be charged. This screen exercises the same
        verified-payment and entitlement flow used by a future production
        adapter.
      </p>
      <button
        className="mt-4 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-[.56rem] border border-[#c73c0b] bg-[#c73c0b] px-[1.1rem] py-[.68rem] font-[680] text-white hover:bg-[#a92e06] disabled:cursor-not-allowed disabled:opacity-55"
        type="button"
        disabled={busy}
        onClick={confirm}
      >
        {busy ? "Confirming…" : "Simulate successful payment"}
      </button>
      {error && (
        <p
          className="mt-4 rounded-[.6rem] border border-[#dfb6b2] bg-[#fbf3f2] px-4 py-[.85rem] leading-6 text-[#8c332f]"
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
}
