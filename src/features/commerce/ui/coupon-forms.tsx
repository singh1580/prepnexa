"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { commerceRequest } from "./api";

type ProductOption = { id: string; name: string; pricePaise: number; currency: string };
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

function dateTimeLocal(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function CouponForm({ products, initial }: { products: ProductOption[]; initial?: CouponFormValue }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = new Set(initial?.products.map(product => product.id) ?? []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await commerceRequest(initial ? `admin/commerce/coupons/${initial.id}` : "admin/commerce/coupons", {
        code: String(data.get("code")),
        type: String(data.get("type")),
        value: Math.round(Number(data.get("value")) * 100),
        currency: "INR",
        maxDiscountPaise: data.get("maxDiscountRupees") ? Math.round(Number(data.get("maxDiscountRupees")) * 100) : null,
        minOrderPaise: Math.round(Number(data.get("minOrderRupees") || 0) * 100),
        totalLimit: data.get("totalLimit") ? Number(data.get("totalLimit")) : null,
        perUserLimit: Number(data.get("perUserLimit") || 1),
        startsAt: data.get("startsAt") ? new Date(String(data.get("startsAt"))).toISOString() : null,
        endsAt: data.get("endsAt") ? new Date(String(data.get("endsAt"))).toISOString() : null,
        active: initial?.active ?? true,
        productIds: data.getAll("productIds"),
      }, initial ? "PATCH" : "POST");
      if (initial) router.push("/admin/coupons");
      else form.reset();
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : `Could not ${initial ? "update" : "create"} coupon.`);
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-form" onSubmit={submit}>
    <fieldset disabled={busy}>
      <div className="question-grid">
        <label className="field"><span>Coupon code</span><input name="code" required minLength={2} maxLength={60} pattern="[A-Za-z0-9_-]+" defaultValue={initial?.code} /></label>
        <label className="field"><span>Discount type</span><select name="type" defaultValue={initial?.type ?? "PERCENT"}><option value="PERCENT">Percentage</option><option value="FIXED">Fixed amount</option></select></label>
        <label className="field"><span>Value (percent or ₹)</span><input name="value" type="number" min="0.01" step="0.01" required defaultValue={initial ? initial.value / 100 : undefined} /></label>
        <label className="field"><span>Maximum discount ₹</span><input name="maxDiscountRupees" type="number" min="0.01" step="0.01" defaultValue={initial?.maxDiscountPaise ? initial.maxDiscountPaise / 100 : undefined} /></label>
        <label className="field"><span>Minimum order ₹</span><input name="minOrderRupees" type="number" min="0" step="0.01" defaultValue={(initial?.minOrderPaise ?? 0) / 100} /></label>
        <label className="field"><span>Total uses</span><input name="totalLimit" type="number" min="1" defaultValue={initial?.totalLimit ?? undefined} /></label>
        <label className="field"><span>Uses per student</span><input name="perUserLimit" type="number" min="1" max="100" defaultValue={initial?.perUserLimit ?? 1} /></label>
        <label className="field"><span>Starts at</span><input name="startsAt" type="datetime-local" defaultValue={dateTimeLocal(initial?.startsAt ?? null)} /></label>
        <label className="field"><span>Ends at</span><input name="endsAt" type="datetime-local" defaultValue={dateTimeLocal(initial?.endsAt ?? null)} /></label>
      </div>
      <fieldset className="content-picker">
        <legend>Eligible products</legend>
        <p className="muted">Select none to allow every published product.</p>
        {products.map(product => <label key={product.id}><input type="checkbox" name="productIds" value={product.id} defaultChecked={selected.has(product.id)} /><span>{product.name} · ₹{(product.pricePaise / 100).toLocaleString("en-IN")}</span></label>)}
      </fieldset>
      <button className="button" type="submit">{busy ? "Saving…" : initial ? "Save coupon" : "Create coupon"}</button>
    </fieldset>
    {error ? <p className="notice danger" role="alert">{error}</p> : null}
  </form>;
}

export function CouponStatusButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await commerceRequest(`admin/commerce/coupons/${id}/status`, { active: !active }, "PATCH");
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not update coupon.");
    } finally {
      setBusy(false);
    }
  }
  return <><button className="text-button" type="button" disabled={busy} onClick={toggle}>{busy ? "Saving…" : active ? "Disable" : "Enable"}</button>{error ? <small className="danger-text" role="alert">{error}</small> : null}</>;
}
