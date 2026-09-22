export type CouponTerms = {
  type: "FIXED" | "PERCENT";
  value: number;
  maxDiscountPaise: number | null;
};

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function calculateDiscount(subtotalPaise: number, coupon: CouponTerms) {
  if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise < 0) throw new Error("Invalid subtotal.");
  const raw = coupon.type === "FIXED"
    ? coupon.value
    : Math.floor((subtotalPaise * coupon.value) / 10_000);
  const capped = coupon.maxDiscountPaise === null ? raw : Math.min(raw, coupon.maxDiscountPaise);
  return Math.max(0, Math.min(subtotalPaise, capped));
}

export function formatMoney(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(paise / 100);
}
