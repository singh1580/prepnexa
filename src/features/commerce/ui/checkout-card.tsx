"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "../pricing";
import { commerceRequest, CommerceApiError } from "./api";

type Preview = { subtotalPaise:number;discountPaise:number;totalPaise:number;currency:string;couponCode:string|null };
type Checkout = Preview & { id:string;status:string;paymentRequired:boolean;paymentAttemptId:string|null;checkoutReference:string|null };

export function CheckoutCard({ productId, slug, pricePaise, currency, initialCoupon = "" }: { productId:string;slug:string;pricePaise:number;currency:string;initialCoupon?:string }) {
  const router = useRouter();
  const key = useRef<string>("");
  const [couponCode,setCouponCode] = useState(initialCoupon);
  const [preview,setPreview] = useState<Preview>({ subtotalPaise:pricePaise,discountPaise:0,totalPaise:pricePaise,currency,couponCode:null });
  const [busy,setBusy] = useState<"coupon"|"checkout"|null>(null);
  const [error,setError] = useState("");

  async function applyCoupon(event: FormEvent) {
    event.preventDefault(); setBusy("coupon"); setError("");
    try { setPreview(await commerceRequest<Preview>("commerce/checkout/preview", { productId, couponCode })); }
    catch (value) { const error = value as CommerceApiError; if (error.code === "UNAUTHENTICATED") router.push(`/login?next=${encodeURIComponent(`/packages/${slug}${couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ""}`)}`); else setError(error.message); }
    finally { setBusy(null); }
  }

  async function checkout() {
    setBusy("checkout"); setError("");
    try {
      key.current ||= crypto.randomUUID();
      const result = await commerceRequest<Checkout>("commerce/checkout", { productId, couponCode: preview.couponCode, idempotencyKey: key.current });
      if (!result.paymentRequired) { router.push("/dashboard/orders?completed=free"); return; }
      if (result.checkoutReference?.startsWith("/")) router.push(result.checkoutReference);
      else if (result.checkoutReference) window.location.assign(result.checkoutReference);
      else router.push("/dashboard/orders");
    } catch (value) { const error = value as CommerceApiError; if (error.code === "UNAUTHENTICATED") router.push(`/login?next=${encodeURIComponent(`/packages/${slug}${couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : ""}`)}`); else setError(error.message); }
    finally { setBusy(null); }
  }

  return <section className="panel checkout-card"><div><span className="eyebrow">SECURE CHECKOUT</span><h2>{preview.totalPaise === 0 ? "Get access" : `Pay ${formatMoney(preview.totalPaise, preview.currency)}`}</h2><p>Price and coupon eligibility are verified again on the server before your order is created.</p></div><form className="coupon-apply" onSubmit={applyCoupon}><label className="field"><span>Coupon code</span><input value={couponCode} onChange={event=>setCouponCode(event.target.value.toUpperCase())} maxLength={60} placeholder="Optional" /></label><button className="button secondary" type="submit" disabled={!couponCode.trim()||Boolean(busy)}>{busy==="coupon"?"Checking…":"Apply"}</button></form>{preview.discountPaise>0?<dl className="checkout-totals"><div><dt>Subtotal</dt><dd>{formatMoney(preview.subtotalPaise,preview.currency)}</dd></div><div><dt>Coupon {preview.couponCode}</dt><dd>− {formatMoney(preview.discountPaise,preview.currency)}</dd></div><div><dt>Total</dt><dd>{formatMoney(preview.totalPaise,preview.currency)}</dd></div></dl>:null}<button className="button full" type="button" onClick={checkout} disabled={Boolean(busy)}>{busy==="checkout"?"Starting securely…":preview.totalPaise===0?"Get access":"Continue to payment"}</button>{error&&<p className="notice danger" role="alert">{error}</p>}</section>;
}
