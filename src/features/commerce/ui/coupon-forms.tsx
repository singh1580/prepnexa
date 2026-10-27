"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { commerceRequest } from "./api";
import { indiaDateTimeLocalToIso, toIndiaDateTimeLocal } from "@/lib/date-time";
import {
  adminControl,
  adminPrimaryButton,
  adminSecondaryButton,
} from "@/components/admin-styles";

const fieldClass = "grid gap-[0.38rem] text-[0.76rem] font-bold text-[#596168]";

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
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">(
    initial?.type ?? "PERCENT",
  );

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
    <form onSubmit={submit}>
      <fieldset className="grid gap-4 border-0 p-0" disabled={busy}>
        <div className="grid grid-cols-2 gap-4 max-[650px]:grid-cols-1">
          <label className={fieldClass}>
            <span>Coupon code</span>
            <input
              className={adminControl}
              name="code"
              required
              minLength={2}
              maxLength={60}
              pattern="[A-Za-z0-9_-]+"
              defaultValue={initial?.code}
            />
          </label>
          <label className={fieldClass}>
            <span>Discount type</span>
            <select
              className={adminControl}
              name="type"
              value={discountType}
              onChange={(event) =>
                setDiscountType(event.target.value as "FIXED" | "PERCENT")
              }
            >
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </label>
          <label className={fieldClass}>
            <span>
              {discountType === "PERCENT"
                ? "Discount percentage"
                : "Discount amount (₹)"}
            </span>
            <input
              className={adminControl}
              name="value"
              type="number"
              min="0.01"
              max={discountType === "PERCENT" ? 100 : undefined}
              step="0.01"
              required
              defaultValue={initial ? initial.value / 100 : undefined}
            />
          </label>
          <label className={fieldClass}>
            <span>Minimum order ₹</span>
            <input
              className={adminControl}
              name="minOrderRupees"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(initial?.minOrderPaise ?? 0) / 100}
            />
          </label>
          <label className={fieldClass}>
            <span>Total uses</span>
            <input
              className={adminControl}
              name="totalLimit"
              type="number"
              min="1"
              defaultValue={initial?.totalLimit ?? undefined}
            />
          </label>
          <label className={fieldClass}>
            <span>Ends at</span>
            <input
              className={adminControl}
              name="endsAt"
              type="datetime-local"
              defaultValue={toIndiaDateTimeLocal(initial?.endsAt ?? null)}
            />
          </label>
        </div>
        <label className="grid cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-x-[0.55rem] gap-y-[0.35rem] text-[0.74rem]">
          <input
            className="peer sr-only"
            name="active"
            type="checkbox"
            defaultChecked={initial?.active ?? true}
          />
          <span
            className="relative row-span-2 h-[1.15rem] w-[2.2rem] rounded-full bg-[#aaa] peer-checked:bg-prep-orange peer-checked:[&_i]:translate-x-[1.05rem] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ffdfd2]"
            aria-hidden="true"
          >
            <i className="absolute top-[0.15rem] left-[0.15rem] size-[0.85rem] rounded-full bg-white transition-transform" />
          </span>
          <b>Active</b>
          <small className="text-[0.65rem] text-prep-muted">
            Coupon can be used by eligible students
          </small>
        </label>
        <details className="rounded-prep-control border border-prep-line p-3">
          <summary className="cursor-pointer font-bold text-prep-ink">
            Limit to selected live products (optional)
          </summary>
          <p className="my-3 text-sm text-prep-muted">
            Leave every package unchecked to allow this coupon on all live
            products.
          </p>
          <div className="grid max-h-60 gap-1 overflow-auto">
            {products.map((product) => (
              <label
                className="flex cursor-pointer items-start gap-3 rounded-prep-control p-2 hover:bg-[#fff5ef] [&_input]:mt-1 [&_input]:accent-prep-orange [&_span]:grid [&_small]:text-[0.68rem] [&_small]:text-prep-muted [&_strong]:text-[0.76rem]"
                key={product.id}
              >
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
              <p className="text-sm text-prep-muted">
                No live products available.
              </p>
            )}
          </div>
        </details>
        <div className="flex justify-end gap-[0.65rem] border-t border-prep-line pt-4">
          <button
            className={adminSecondaryButton}
            type="button"
            onClick={(event) => event.currentTarget.closest("dialog")?.close()}
          >
            Cancel
          </button>
          <button className={adminPrimaryButton} type="submit">
            {busy ? "Saving…" : initial ? "Save coupon" : "Save coupon"}
          </button>
        </div>
      </fieldset>
      {error ? (
        <p
          className="mt-3 rounded-prep-control border border-[#efc1bd] bg-[#fdebea] p-3 text-sm text-[#ad3028]"
          role="alert"
        >
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
    <div className="grid justify-items-center gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        className={`relative h-[1.2rem] w-[2.25rem] rounded-full border-0 transition-colors disabled:opacity-50 ${active ? "bg-[#22a861]" : "bg-[#a8adb1]"}`}
        disabled={busy}
        onClick={toggle}
      >
        <i
          className={`absolute top-[0.15rem] left-[0.15rem] size-[0.9rem] rounded-full bg-white transition-transform ${active ? "translate-x-[1.05rem]" : ""}`}
          aria-hidden="true"
        />
        <span className="sr-only">
          {busy ? "Saving" : active ? "Disable coupon" : "Enable coupon"}
        </span>
      </button>
      {error ? (
        <small className="text-[0.65rem] text-[#ad3028]" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}
