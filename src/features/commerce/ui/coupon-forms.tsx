"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { commerceRequest } from "./api";
import {
  indiaDateTimeLocalToIso,
  toIndiaDateTimeLocal,
} from "@/lib/date-time";

type ProductOption = {
  id: string;
  name: string;
  pricePaise: number;
  currency: string;
};
export type CouponFormValue = {
  id: string;
  code: string;
  type: "FIXED" | "PERCENT";
  value: number;
  maxDiscountPaise: number | null;
  minOrderPaise: number;
  totalLimit: number | null;
  perUserLimit: number;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  active: boolean;
  products: { id: string }[];
};

export function CouponForm({
  products,
  initial,
}: {
  products: ProductOption[];
  initial?: CouponFormValue;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await commerceRequest(
        initial
          ? `admin/commerce/coupons/${initial.id}`
          : "admin/commerce/coupons",
        {
          code: String(data.get("code")),
          type: String(data.get("type")),
          value: Math.round(Number(data.get("value")) * 100),
          currency: "INR",
          maxDiscountPaise: null,
          minOrderPaise: Math.round(
            Number(data.get("minOrderRupees") || 0) * 100,
          ),
          totalLimit: data.get("totalLimit")
            ? Number(data.get("totalLimit"))
            : null,
          perUserLimit: 1,
          startsAt: null,
          endsAt: data.get("endsAt")
            ? indiaDateTimeLocalToIso(String(data.get("endsAt")))
            : null,
          active: data.get("active") === "on",
          productIds: data.getAll("productIds"),
        },
        initial ? "PATCH" : "POST",
      );
      if (!initial) form.reset();
      form.closest("dialog")?.close();
      router.replace("/admin/coupons");
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : `Could not ${initial ? "update" : "create"} coupon.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <div className="question-grid">
          <label className="field">
            <span>Coupon code</span>
            <input
              name="code"
              required
              minLength={2}
              maxLength={60}
              pattern="[A-Za-z0-9_-]+"
              defaultValue={initial?.code}
            />
          </label>
          <label className="field">
            <span>Discount type</span>
            <select name="type" defaultValue={initial?.type ?? "PERCENT"}>
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </label>
          <label className="field">
            <span>Value (percent or ₹)</span>
            <input
              name="value"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={initial ? initial.value / 100 : undefined}
            />
          </label>
          <label className="field">
            <span>Minimum order ₹</span>
            <input
              name="minOrderRupees"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(initial?.minOrderPaise ?? 0) / 100}
            />
          </label>
          <label className="field">
            <span>Total uses</span>
            <input
              name="totalLimit"
              type="number"
              min="1"
              defaultValue={initial?.totalLimit ?? undefined}
            />
          </label>
          <label className="field">
            <span>Ends at</span>
            <input
              name="endsAt"
              type="datetime-local"
              defaultValue={toIndiaDateTimeLocal(initial?.endsAt ?? null)}
            />
          </label>
        </div>
        <label className="coupon-active-control">
          <input
            name="active"
            type="checkbox"
            defaultChecked={initial?.active ?? true}
          />
          <span aria-hidden="true">
            <i />
          </span>
          <b>Active</b>
          <small>Coupon can be used by eligible students</small>
        </label>
        <details className="coupon-scope">
          <summary>Limit to selected live products (optional)</summary>
          <p className="muted">
            Leave every package unchecked to allow this coupon on all live
            products.
          </p>
          <div className="content-choice-list">
            {products.map((product) => (
              <label className="content-choice" key={product.id}>
                <input
                  name="productIds"
                  value={product.id}
                  type="checkbox"
                  defaultChecked={initial?.products.some(
                    (item) => item.id === product.id,
                  )}
                />
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    ₹{(product.pricePaise / 100).toLocaleString("en-IN")}
                  </small>
                </span>
              </label>
            ))}
            {!products.length && (
              <p className="muted">No live products available.</p>
            )}
          </div>
        </details>
        <div className="dialog-form-footer">
          <button
            className="button secondary"
            type="button"
            onClick={(event) => event.currentTarget.closest("dialog")?.close()}
          >
            Cancel
          </button>
          <button className="button" type="submit">
            {busy ? "Saving…" : initial ? "Save coupon" : "Save coupon"}
          </button>
        </div>
      </fieldset>
      {error ? (
        <p className="notice danger" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function CouponStatusButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await commerceRequest(
        `admin/commerce/coupons/${id}/status`,
        { active: !active },
        "PATCH",
      );
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Could not update coupon.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="visibility-control">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        className={active ? "availability-toggle on" : "availability-toggle"}
        disabled={busy}
        onClick={toggle}
      >
        <i aria-hidden="true" />
        <span className="sr-only">
          {busy ? "Saving" : active ? "Disable coupon" : "Enable coupon"}
        </span>
      </button>
      {error ? (
        <small className="danger-text" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
