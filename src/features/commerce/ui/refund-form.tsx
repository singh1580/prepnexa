"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { commerceRequest } from "./api";
import { adminControl, adminSecondaryButton } from "@/components/admin-styles";

const fieldClass = "grid gap-1 text-[0.76rem] font-bold text-[#596168]";

export function RefundForm({
  paymentId,
  maxPaise,
}: {
  paymentId: string;
  maxPaise: number;
}) {
  const router = useRouter();
  const key = useRef("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    key.current ||= crypto.randomUUID();
    const data = new FormData(event.currentTarget);
    try {
      await commerceRequest(`admin/commerce/payments/${paymentId}/refund`, {
        amountPaise: Math.round(Number(data.get("amountRupees")) * 100),
        reason: String(data.get("reason")),
        revokeAccess: data.get("revokeAccess") === "on",
        idempotencyKey: key.current,
      });
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Refund failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset className="grid gap-3 border-0 p-0" disabled={busy}>
        <label className={fieldClass}>
          <span>Refund ₹</span>
          <input
            className={adminControl}
            name="amountRupees"
            type="number"
            min="0.01"
            max={maxPaise / 100}
            step="0.01"
            required
          />
        </label>
        <label className={fieldClass}>
          <span>Reason</span>
          <input
            className={adminControl}
            name="reason"
            minLength={3}
            maxLength={1000}
            required
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[0.76rem] font-semibold [&_input]:accent-prep-orange">
          <input name="revokeAccess" type="checkbox" /> Revoke package access
        </label>
        <button className={adminSecondaryButton} type="submit">
          {busy ? "Processing…" : "Refund"}
        </button>
      </fieldset>
      {error && (
        <p
          className="mt-3 rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
