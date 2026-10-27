/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { ProductCoverImage } from "@/components/product-cover-image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  StorefrontProductCard,
  type StorefrontProduct,
} from "@/components/storefront-product-card";
import { calculateOrderTotals, formatMoney } from "../pricing";
import { commerceRequest, CommerceApiError } from "./api";
import { formatAccessDuration } from "@/features/catalog/presentation";
import { UiIcon } from "@/components/ui-icon";
import { PrepstoreIcon } from "@/components/brand";
import { normalizeIndianMobile } from "@/lib/phone";

const storageKey = "prepstore-cart";
const cartEvent = "prepstore-cart";
const couponStorageKey = "prepstore-cart-coupon-v1";
const primaryButton =
  "flex min-h-12 cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-prep-orange px-4 py-[.7rem] text-[.8rem] font-[760] text-white hover:border-prep-orange-dark hover:bg-prep-orange-dark disabled:cursor-not-allowed disabled:opacity-55";
const emptyState =
  "mt-4 rounded-[.85rem] border border-[var(--line)] bg-white px-6 py-14 text-center shadow-[0_.6rem_2rem_#3a2b2108]";
const dangerNotice =
  "mt-4 rounded-[.6rem] border border-[#dfb6b2] bg-[#fbf3f2] px-4 py-[.85rem] leading-6 text-[#8c332f]";
const appliedCoupon =
  "col-span-full mt-[.55rem] mb-0 flex items-center justify-between gap-3 rounded-[.4rem] border border-[#bde2c9] bg-[#f0faf3] px-[.7rem] py-[.55rem] text-[.72rem] text-[#246b3e] [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere] [&>button]:cursor-pointer [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0 [&>button]:py-[.2rem] [&>button]:font-[760] [&>button]:text-[#c83d0b] [&>button:disabled]:cursor-not-allowed [&>button:disabled]:opacity-55";
const checkoutCard =
  "relative min-w-0 overflow-hidden rounded-xl border border-[#e8e3de] bg-white p-[1.2rem] shadow-[0_.8rem_2.5rem_#3a24100a] before:absolute before:inset-x-0 before:top-0 before:h-[.22rem] before:bg-[#e94a16] max-[560px]:p-4";
const checkoutTitle =
  "mb-4 flex items-start gap-3 [&>i]:grid [&>i]:size-[1.8rem] [&>i]:shrink-0 [&>i]:place-items-center [&>i]:rounded-full [&>i]:bg-[#fff0e9] [&>i]:text-[.72rem] [&>i]:font-[850] [&>i]:not-italic [&>i]:text-[#dc4312] [&_h2]:m-0 [&_h2]:text-[1.05rem] [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[.7rem] [&_p]:leading-[1.45] [&_p]:text-[#72787d]";
const checkoutInput =
  "h-[2.7rem] min-w-0 rounded-[.35rem] border border-[#d9dadd] bg-[#fafafa] px-[.8rem] py-[.65rem] text-[#394047] outline-none focus:border-[#f07950] focus:ring-3 focus:ring-[#ef4d1810]";
export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverObjectKey: string | null;
  mrpPaise: number | null;
  pricePaise: number;
  currency: string;
  accessDays: number;
};
type Preview = {
  products: CartProduct[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  couponCode: string | null;
};
type Checkout = Preview & {
  id: string;
  status: string;
  paymentRequired: boolean;
  paymentAttemptId: string | null;
  checkoutReference: string | null;
};
type Account = { name: string; email: string; phone: string | null };

export function readCart() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string").slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
function normalizeCoupon(value: string) {
  return value.trim().toUpperCase().slice(0, 60);
}
function readCoupon() {
  if (typeof window === "undefined") return "";
  return normalizeCoupon(localStorage.getItem(couponStorageKey) ?? "");
}
function writeCoupon(value: string) {
  const normalized = normalizeCoupon(value);
  if (normalized) localStorage.setItem(couponStorageKey, normalized);
  else localStorage.removeItem(couponStorageKey);
  return normalized;
}
function writeCart(ids: string[]) {
  localStorage.setItem(storageKey, JSON.stringify(ids));
  window.dispatchEvent(new Event(cartEvent));
  return ids;
}
function cartSnapshot() {
  return readCart().join(",");
}
function serverCartSnapshot() {
  return "";
}
function subscribeCart(onStoreChange: () => void) {
  window.addEventListener(cartEvent, onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(cartEvent, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}
function useCartIds() {
  const value = useSyncExternalStore(
    subscribeCart,
    cartSnapshot,
    serverCartSnapshot,
  );
  return useMemo(() => (value ? value.split(",") : []), [value]);
}
function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
export function addCartItem(id: string) {
  return writeCart([...new Set([...readCart(), id])]).length;
}
export function clearCart() {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(couponStorageKey);
  window.dispatchEvent(new Event(cartEvent));
}
function removeCartItem(id: string) {
  const next = readCart().filter((item) => item !== id);
  writeCart(next);
  if (!next.length) writeCoupon("");
}
function reconcileCart(requestedIds: string[], products: CartProduct[]) {
  const valid = new Set(products.map((product) => product.id));
  const next = requestedIds.filter((id) => valid.has(id));
  if (next.join(",") !== requestedIds.join(",")) writeCart(next);
  return next;
}
async function loadProducts(ids: string[], signal?: AbortSignal) {
  if (!ids.length) return [];
  const query = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
  const response = await fetch(`/api/catalog/cart?${query}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result?.error?.message ?? "Couldn't load your cart.");
  if (!Array.isArray(result?.data))
    throw new Error(
      "The cart response was invalid. Please refresh and try again.",
    );
  return result.data as CartProduct[];
}
const localPreview = (products: CartProduct[]): Preview => {
  const subtotalPaise = products.reduce(
    (sum, item) => sum + item.pricePaise,
    0,
  );
  return {
    products,
    subtotalPaise,
    discountPaise: 0,
    ...calculateOrderTotals(subtotalPaise),
    currency: products[0]?.currency ?? "INR",
    couponCode: null,
  };
};
export function CartCount() {
  const ids = useCartIds();
  const hydrated = useCartHydrated();
  useEffect(() => {
    if (!hydrated || !ids.length) return;
    const controller = new AbortController();
    void loadProducts(ids, controller.signal)
      .then((products) => reconcileCart(ids, products))
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          return;
      });
    return () => controller.abort();
  }, [hydrated, ids]);
  return (
    <span
      className="cart-count grid h-5 min-w-5 place-items-center rounded-full bg-[var(--orange)] px-1 text-[.62rem] font-extrabold text-white"
      aria-label={`${hydrated ? ids.length : 0} products in cart`}
    >
      {hydrated ? ids.length : 0}
    </span>
  );
}
export function AddToCartButton({
  productId,
  className = "inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-[.56rem] border border-[#d8d2ca] bg-white px-[1.1rem] py-[.68rem] font-[680] text-[#25272b] hover:border-[#c9c1b8] hover:bg-[#f5f1eb] disabled:cursor-not-allowed disabled:opacity-55",
}: {
  productId: string;
  className?: string;
}) {
  const ids = useCartIds();
  const added = ids.includes(productId);
  return added ? (
    <Link
      className={`${className} inline-flex items-center justify-center`}
      href="/cart"
    >
      Go to cart →
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      onClick={() => addCartItem(productId)}
    >
      Add to cart
    </button>
  );
}

function ProductRows({
  products,
  onRemove,
  compact = false,
}: {
  products: CartProduct[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {products.map((product) => {
        const discount =
          product.mrpPaise && product.mrpPaise > product.pricePaise
            ? Math.round((1 - product.pricePaise / product.mrpPaise) * 100)
            : 0;
        return (
          <article
            className={`relative grid items-center gap-4 border-t border-[#e8e5e1] bg-white p-4 ${compact ? "grid-cols-[3.5rem_minmax(0,1fr)_auto] py-[.65rem] max-[560px]:grid-cols-[3.5rem_minmax(0,1fr)]" : "grid-cols-[7rem_minmax(0,1fr)_auto] max-[560px]:grid-cols-[4.5rem_minmax(0,1fr)] max-[560px]:gap-3"}`}
            key={product.id}
          >
            <div
              className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[.55rem] bg-[linear-gradient(135deg,#27292d,#ef5a23)] text-white [&>img]:size-full [&>img]:object-cover ${compact ? "size-14" : "h-20 w-28 max-[560px]:size-[4.5rem]"}`}
            >
              {product.coverObjectKey ? (
                <ProductCoverImage
                  productId={product.id}
                  alt={`${product.name} cover`}
                  sizes={compact ? "56px" : "112px"}
                  fallback={
                    <b>{product.name.slice(0, 2).toUpperCase()}</b>
                  }
                />
              ) : (
                <b>{product.name.slice(0, 2).toUpperCase()}</b>
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/packages/${product.slug}`}>
                <h2
                  className={`[overflow-wrap:anywhere] ${compact ? "my-[.1rem] text-[.72rem]" : "my-[.4rem] text-[.9rem]"}`}
                >
                  {product.name}
                </h2>
              </Link>
              <p
                className={`flex items-center gap-[.45rem] text-[var(--muted)] ${compact ? "my-[.2rem] text-[.75rem]" : "my-[.35rem] text-[.75rem]"}`}
              >
                {formatAccessDuration(product.accessDays)} access
                <i className="h-[.8rem] w-px bg-[#c8c8c8]" /> Digital package
              </p>
              <div
                className={`items-center gap-[.65rem] ${compact ? "hidden" : "mt-[1.3rem] flex max-[560px]:mt-2"}`}
              >
                <strong className="text-prep-orange">
                  {formatMoney(product.pricePaise, product.currency)}
                </strong>
                {product.mrpPaise && product.mrpPaise > product.pricePaise ? (
                  <del className="text-[.72rem] text-[#999]">
                    {formatMoney(product.mrpPaise, product.currency)}
                  </del>
                ) : null}
                {discount > 0 ? (
                  <span className="rounded-[.35rem] border border-[#ffb79d] bg-[#fff4ef] px-[.45rem] py-[.22rem] text-[.62rem] font-[750] text-prep-orange">
                    {discount}% OFF
                  </span>
                ) : null}
              </div>
            </div>
            {onRemove ? (
              <button
                type="button"
                className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-[.35rem] rounded-[.35rem] border-0 bg-transparent px-2 py-[.35rem] text-[.68rem] hover:bg-[#fff0e8] hover:text-prep-orange max-[560px]:col-start-2 max-[560px]:justify-self-start [&>svg]:size-4 [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-[1.7]"
                aria-label={`Remove ${product.name} from cart`}
                onClick={() => onRemove(product.id)}
              >
                <UiIcon name="trash" /> Remove
              </button>
            ) : (
              <strong className="whitespace-nowrap max-[560px]:col-start-2">
                {formatMoney(product.pricePaise, product.currency)}
              </strong>
            )}
          </article>
        );
      })}
    </div>
  );
}

function PriceSummary({
  preview,
  itemCount,
}: {
  preview: Preview;
  itemCount: number;
}) {
  return (
    <dl className="m-0 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:border-t [&>div]:border-[#ece9e5] [&>div]:py-[.65rem] [&>div]:text-[.75rem] [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-[650]">
      <div>
        <dt>
          Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"})
        </dt>
        <dd>{formatMoney(preview.subtotalPaise, preview.currency)}</dd>
      </div>
      {preview.discountPaise > 0 ? (
        <div className="text-[#108342]">
          <dt>Coupon ({preview.couponCode})</dt>
          <dd>− {formatMoney(preview.discountPaise, preview.currency)}</dd>
        </div>
      ) : null}
      <div className="mt-1 pt-4 text-base font-extrabold [&>dd]:text-xl [&>dd]:text-[#e94611]">
        <dt>Total payable</dt>
        <dd>{formatMoney(preview.totalPaise, preview.currency)}</dd>
      </div>
    </dl>
  );
}

export function CartPageClient({
  suggestions,
}: {
  suggestions: StorefrontProduct[];
}) {
  const cartIds = useCartIds();
  const hydrated = useCartHydrated();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setLoading(true);
    const initialize = async () => {
      try {
        const items = await loadProducts(cartIds, controller.signal);
        if (controller.signal.aborted) return;
        const validIds = reconcileCart(cartIds, items);
        const savedCoupon = readCoupon();
        setProducts(items);
        setCoupon(savedCoupon);
        if (savedCoupon && validIds.length) {
          try {
            const priced = await commerceRequest<Preview>(
              "commerce/checkout/preview",
              { productIds: validIds, couponCode: savedCoupon },
            );
            if (controller.signal.aborted) return;
            setPreview(priced);
            setCoupon(writeCoupon(priced.couponCode ?? savedCoupon));
            setError("");
          } catch (value) {
            if (controller.signal.aborted) return;
            const issue = value as CommerceApiError;
            if (issue.code === "UNAUTHENTICATED") {
              setPreview(localPreview(items));
              setError(
                "Sign in at checkout to validate and use this saved coupon.",
              );
            } else {
              writeCoupon("");
              setCoupon("");
              setPreview(localPreview(items));
              setError(`Saved coupon was removed: ${issue.message}`);
            }
          }
        } else {
          setPreview(localPreview(items));
          setError("");
        }
      } catch (value) {
        if (value instanceof DOMException && value.name === "AbortError")
          return;
        setError(
          value instanceof Error ? value.message : "Couldn't load your cart.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void initialize();
    return () => controller.abort();
  }, [hydrated, cartIds]);
  async function applyCoupon(event: FormEvent) {
    event.preventDefault();
    const nextCoupon = normalizeCoupon(coupon);
    setCoupon(nextCoupon);
    setBusy(true);
    setError("");
    try {
      const priced = await commerceRequest<Preview>(
        "commerce/checkout/preview",
        { productIds: products.map((item) => item.id), couponCode: nextCoupon },
      );
      setPreview(priced);
      setCoupon(writeCoupon(priced.couponCode ?? nextCoupon));
    } catch (value) {
      const issue = value as CommerceApiError;
      setError(
        issue.code === "UNAUTHENTICATED"
          ? "Sign in at checkout to validate and use this coupon."
          : issue.message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeCoupon() {
    setBusy(true);
    setError("");
    try {
      const priced = await commerceRequest<Preview>(
        "commerce/checkout/preview",
        { productIds: products.map((item) => item.id), couponCode: null },
      );
      setPreview(priced);
      setCoupon("");
      writeCoupon("");
    } catch (value) {
      const issue = value as CommerceApiError;
      if (issue.code === "UNAUTHENTICATED") {
        setPreview(localPreview(products));
        setCoupon("");
        writeCoupon("");
      } else setError(issue.message);
    } finally {
      setBusy(false);
    }
  }
  const recommended = suggestions
    .filter((item) => !products.some((product) => product.id === item.id))
    .slice(0, 3);
  return (
    <>
      <nav
        className="my-[0.2rem] mb-4 flex items-center gap-[0.55rem] text-[0.78rem] text-[#667078] [&_b]:text-[#202326]"
        aria-label="Breadcrumb"
      >
        <Link href="/">Home</Link>
        <span>›</span>
        <b>Your cart</b>
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)_23rem] items-start gap-6 max-[800px]:grid-cols-1 max-[560px]:gap-[.8rem] [&>*]:min-w-0">
        <section className="min-w-0">
          <header>
            <h1 className="m-0 text-[2rem] tracking-[-.04em] max-[560px]:text-[1.65rem]">
              Your cart
            </h1>
            <p className="mt-[.35rem] mb-[1.1rem] text-[.78rem] text-[#687077]">
              {products.length} item{products.length === 1 ? "" : "s"} in your
              cart
            </p>
          </header>
          {loading ? (
            <p>Loading cart…</p>
          ) : products.length ? (
            <>
              <ProductRows products={products} onRemove={removeCartItem} />
              <form
                className="mt-[1.2rem] border-t border-[#e5e2de] pt-[1.2rem]"
                onSubmit={applyCoupon}
              >
                <label
                  className="mb-[.55rem] block text-[.78rem] font-bold"
                  htmlFor="cart-coupon"
                >
                  Apply coupon code
                </label>
                <div className="grid grid-cols-[1fr_6.5rem] gap-[.55rem] max-[420px]:grid-cols-1">
                  <input
                    className="h-[2.7rem] min-w-0 rounded-[.35rem] border border-[#d9dadd] bg-white px-[.8rem] py-[.65rem] outline-none focus:border-[#f07950] focus:ring-3 focus:ring-[#ef4d1810]"
                    id="cart-coupon"
                    value={coupon}
                    onChange={(event) =>
                      setCoupon(normalizeCoupon(event.target.value))
                    }
                    placeholder="Enter coupon code"
                    maxLength={60}
                  />
                  <button
                    className="cursor-pointer rounded-[.35rem] border-0 bg-[#ffebe3] font-bold text-[#e64a17] disabled:cursor-not-allowed disabled:opacity-55 max-[420px]:min-h-11"
                    disabled={
                      !coupon.trim() || busy || coupon === preview?.couponCode
                    }
                  >
                    {busy
                      ? "Updating…"
                      : coupon === preview?.couponCode
                        ? "Applied"
                        : "Apply"}
                  </button>
                </div>
                {preview?.couponCode ? (
                  <p className={appliedCoupon}>
                    <span>
                      <b>{preview.couponCode}</b> applied
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={removeCoupon}
                    >
                      Remove
                    </button>
                  </p>
                ) : null}
              </form>
              <Link
                className="mt-6 inline-flex text-[.76rem] font-bold text-[#e74410] [&>span]:ml-[.4rem]"
                href="/packages"
              >
                ← <span>Continue browsing</span>
              </Link>
            </>
          ) : (
            <section className={emptyState}>
              <h2>Your cart is empty</h2>
              <p>
                Explore Prepstore packages and add the preparation you need.
              </p>
              <Link
                className={`${primaryButton} mx-auto w-fit`}
                href="/packages"
              >
                Explore packages
              </Link>
            </section>
          )}
          {error ? (
            <p className={dangerNotice} role="alert">
              {error}
            </p>
          ) : null}
        </section>
        {products.length > 0 && preview ? (
          <aside className="sticky top-24 rounded-[.45rem] border border-[#dfdedb] bg-white p-[1.2rem] max-[800px]:static max-[560px]:p-4">
            <h2 className="mt-[.1rem] mb-4 text-[1.1rem]">Order summary</h2>
            <PriceSummary preview={preview} itemCount={products.length} />
            <Link
              className={`${primaryButton} mt-4 w-full`}
              href={
                preview.couponCode
                  ? `/checkout?coupon=${encodeURIComponent(preview.couponCode)}`
                  : "/checkout"
              }
            >
              Proceed to checkout
            </Link>
            <p className="flex gap-[.6rem] text-[.68rem] leading-[1.4] text-[#6b7177]">
              ▣{" "}
              <span>Secure &amp; safe payment powered by trusted partners</span>
            </p>
          </aside>
        ) : null}
      </div>
      {recommended.length ? (
        <section className="mt-12">
          <header className="mb-[.8rem] flex items-center justify-between">
            <h2 className="m-0 text-[1.35rem]">You may also like</h2>
            <Link
              className="text-[.72rem] font-bold text-prep-orange"
              href="/packages"
            >
              View all <span>→</span>
            </Link>
          </header>
          <div className="grid grid-cols-3 gap-[.8rem] max-[800px]:grid-cols-2 max-[560px]:grid-flow-col max-[560px]:auto-cols-[minmax(16.5rem,82vw)] max-[560px]:grid-cols-none max-[560px]:overflow-x-auto max-[560px]:pb-2 max-[560px]:[scrollbar-width:none] max-[560px]:[&::-webkit-scrollbar]:hidden">
            {recommended.map((item, index) => (
              <StorefrontProductCard
                key={item.id}
                product={item}
                index={index + 2}
                variant="catalog"
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function CheckoutPageClient({
  account,
  initialCoupon = "",
}: {
  account: Account | null;
  initialCoupon?: string;
}) {
  const cartIds = useCartIds();
  const hydrated = useCartHydrated();
  const router = useRouter();
  const key = useRef("");
  const initialCouponRef = useRef(normalizeCoupon(initialCoupon));
  const accountRef = useRef(account);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [coupon, setCoupon] = useState(normalizeCoupon(initialCoupon));
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function refresh(code: string | null = null) {
    const ids = readCart();
    if (!ids.length) {
      setProducts([]);
      setPreview(null);
      return null;
    }
    const items = await loadProducts(ids);
    const validIds = reconcileCart(ids, items);
    setProducts(items);
    const priced = account
      ? await commerceRequest<Preview>("commerce/checkout/preview", {
          productIds: validIds,
          couponCode: code,
        })
      : localPreview(items);
    setPreview(priced);
    setError("");
    return priced;
  }
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    const initialize = async () => {
      setLoading(true);
      if (!cartIds.length) {
        setProducts([]);
        setPreview(null);
        setLoading(false);
        return;
      }
      const savedCoupon = initialCouponRef.current || readCoupon();
      setCoupon(savedCoupon);
      try {
        const items = await loadProducts(cartIds, controller.signal);
        if (controller.signal.aborted) return;
        const validIds = reconcileCart(cartIds, items);
        setProducts(items);
        if (accountRef.current) {
          try {
            const priced = await commerceRequest<Preview>(
              "commerce/checkout/preview",
              { productIds: validIds, couponCode: savedCoupon || null },
            );
            if (controller.signal.aborted) return;
            setPreview(priced);
            if (priced.couponCode) {
              setCoupon(writeCoupon(priced.couponCode));
              router.replace(
                `/checkout?coupon=${encodeURIComponent(priced.couponCode)}`,
                { scroll: false },
              );
            }
          } catch (value) {
            if (controller.signal.aborted) return;
            const issue = value as CommerceApiError;
            if (savedCoupon) {
              writeCoupon("");
              setCoupon("");
              router.replace("/checkout", { scroll: false });
              setPreview(
                await commerceRequest<Preview>("commerce/checkout/preview", {
                  productIds: validIds,
                  couponCode: null,
                }),
              );
              setError(`Saved coupon was removed: ${issue.message}`);
            } else throw value;
          }
        } else setPreview(localPreview(items));
      } catch (value) {
        if (value instanceof DOMException && value.name === "AbortError")
          return;
        const issue = value as CommerceApiError;
        setError(issue.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void initialize();
    return () => controller.abort();
  }, [hydrated, cartIds, router]);
  async function apply(event: FormEvent) {
    event.preventDefault();
    const nextCoupon = normalizeCoupon(coupon);
    setCoupon(nextCoupon);
    setBusy("coupon");
    setError("");
    try {
      const priced = await refresh(nextCoupon);
      const applied = writeCoupon(priced?.couponCode ?? nextCoupon);
      setCoupon(applied);
      router.replace(`/checkout?coupon=${encodeURIComponent(applied)}`, {
        scroll: false,
      });
    } catch (value) {
      const issue = value as CommerceApiError;
      setError(issue.message);
    } finally {
      setBusy("");
    }
  }
  async function removeCoupon() {
    setBusy("coupon");
    setError("");
    try {
      await refresh(null);
      setCoupon("");
      writeCoupon("");
      router.replace("/checkout", { scroll: false });
    } catch (value) {
      const issue = value as CommerceApiError;
      setError(issue.message);
    } finally {
      setBusy("");
    }
  }
  async function placeOrder() {
    const normalizedPhone = normalizeIndianMobile(phone);
    const phoneRequired = Boolean(preview && preview.totalPaise > 0);
    setPhoneTouched(phoneRequired);
    if (phoneRequired && !normalizedPhone) return;
    setBusy("order");
    setError("");
    try {
      key.current ||= crypto.randomUUID();
      const result = await commerceRequest<Checkout>("commerce/checkout", {
        productIds: readCart(),
        couponCode: preview?.couponCode,
        idempotencyKey: key.current,
        phone: normalizedPhone,
      });
      if (!result.paymentRequired) {
        clearCart();
        router.push(`/invoice/${result.id}`);
      } else if (result.checkoutReference?.startsWith("/"))
        router.push(result.checkoutReference);
      else if (result.checkoutReference)
        window.location.assign(result.checkoutReference);
      else router.push(`/dashboard/orders/${result.id}`);
    } catch (value) {
      const issue = value as CommerceApiError;
      setError(issue.message);
    } finally {
      setBusy("");
    }
  }
  if (loading)
    return (
      <section className={emptyState} aria-live="polite">
        <div
          className="mx-auto mb-3 size-8 animate-spin rounded-full border-[.2rem] border-[#f4c7b6] border-t-[#e94b17]"
          aria-hidden="true"
        />
        <h1>Preparing checkout…</h1>
        <p>We’re confirming your cart and current price.</p>
      </section>
    );
  if (!products.length && !error)
    return (
      <section className={emptyState}>
        <h1>Your cart is empty</h1>
        <Link className={`${primaryButton} mx-auto w-fit`} href="/packages">
          Explore packages
        </Link>
      </section>
    );
  const phoneRequired = Boolean(preview && preview.totalPaise > 0);
  const phoneValid = !phoneRequired || Boolean(normalizeIndianMobile(phone));
  return (
    <>
      <nav
        className="my-[0.2rem] mb-4 flex items-center gap-[0.55rem] text-[0.78rem] text-[#667078] [&_b]:text-[#202326]"
        aria-label="Breadcrumb"
      >
        <Link href="/cart">Cart</Link>
        <span>›</span>
        <b>Checkout</b>
      </nav>
      <header className="relative mb-6 rounded-xl border border-[#ece4dc] bg-[linear-gradient(110deg,#fff_0%,#fff8f3_100%)] px-[1.6rem] py-[1.45rem] max-[560px]:p-[1.15rem]">
        <span className="flex items-center gap-[.55rem] text-[.65rem] font-[850] tracking-[.1em] text-[#d94412]">
          <PrepstoreIcon className="block size-7 shrink-0 object-contain" />{" "}
          PREPSTORE SECURE CHECKOUT
        </span>
        <h1 className="mt-[.65rem] mb-1 text-[2rem] tracking-[-.04em] max-[560px]:text-[1.65rem]">
          Checkout
        </h1>
        <p className="mt-[.35rem] mb-[1.1rem] text-[.78rem] text-[#687077]">
          Complete your purchase to get instant access to your selected
          packages.
        </p>
        <ol
          className="mt-5 mb-0 flex list-none items-center p-0"
          aria-label="Checkout progress"
        >
          <li className="flex min-w-32 items-center text-[.7rem] font-[750] text-[#d94412] max-[560px]:min-w-0 max-[560px]:flex-1 max-[560px]:text-[.64rem]">
            <i className="mr-2 grid size-[1.65rem] shrink-0 place-items-center rounded-full border border-[#e84a16] bg-[#e84a16] text-[.7rem] not-italic text-white max-[560px]:mr-[.32rem] max-[560px]:size-[1.45rem]">
              1
            </i>
            Cart
            <b className="mx-3 h-px w-11 bg-[#e84a16] max-[560px]:mx-[.35rem] max-[560px]:flex-1" />
          </li>
          <li
            className={`flex min-w-32 items-center text-[.7rem] font-[750] max-[560px]:min-w-0 max-[560px]:flex-1 max-[560px]:text-[.64rem] ${account ? "text-[#d94412]" : "text-[#d94412]"}`}
          >
            <i className="mr-2 grid size-[1.65rem] shrink-0 place-items-center rounded-full border border-[#e84a16] bg-[#e84a16] text-[.7rem] not-italic text-white max-[560px]:mr-[.32rem] max-[560px]:size-[1.45rem]">
              2
            </i>
            Account
            <b
              className={`mx-3 h-px w-11 max-[560px]:mx-[.35rem] max-[560px]:flex-1 ${account ? "bg-[#e84a16]" : "bg-[#dddfe1]"}`}
            />
          </li>
          <li
            className={`flex min-w-32 items-center text-[.7rem] font-[750] max-[560px]:min-w-0 max-[560px]:flex-1 max-[560px]:text-[.64rem] ${account ? "text-[#d94412]" : "text-[#92979c]"}`}
          >
            <i
              className={`mr-2 grid size-[1.65rem] shrink-0 place-items-center rounded-full border text-[.7rem] not-italic max-[560px]:mr-[.32rem] max-[560px]:size-[1.45rem] ${account ? "border-[#e84a16] bg-[#e84a16] text-white" : "border-[#d8dadd] bg-white text-[#8b9095]"}`}
            >
              3
            </i>
            Payment
          </li>
        </ol>
      </header>
      <div className="grid grid-cols-[minmax(18rem,.92fr)_minmax(22rem,1.08fr)] items-start gap-4 max-[800px]:grid-cols-1 [&>*]:min-w-0">
        <section className={checkoutCard}>
          <div className={checkoutTitle}>
            <i aria-hidden="true">1</i>
            <div>
              <h2>Billing details</h2>
              <p>
                Your verified name and email are used for this order. Confirm a
                mobile number for payment.
              </p>
            </div>
          </div>
          {account ? (
            <div className="mt-[1.2rem] grid gap-[.85rem]">
              <label className="grid gap-[.4rem] text-[.72rem] font-bold">
                Full name
                <input
                  className={checkoutInput}
                  value={account.name}
                  readOnly
                />
              </label>
              <label className="grid gap-[.4rem] text-[.72rem] font-bold">
                Email address
                <input
                  className={checkoutInput}
                  value={account.email}
                  readOnly
                />
              </label>
              <label className="grid gap-[.4rem] text-[.72rem] font-bold">
                Phone number
                <input
                  className={checkoutInput}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  value={phone}
                  onBlur={() => setPhoneTouched(true)}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="10-digit mobile number"
                  aria-invalid={phoneTouched && !phoneValid}
                />
                <small className="text-[.65rem] font-normal text-prep-muted">
                  This number is required for this paid order and will be sent
                  to Razorpay.
                </small>
                {phoneTouched && !phoneValid ? (
                  <em
                    className="text-[.65rem] not-italic text-[#a12618]"
                    role="alert"
                  >
                    Enter a valid 10-digit Indian mobile number.
                  </em>
                ) : null}
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 max-[560px]:flex-col max-[560px]:items-stretch">
              <p>
                Sign in to use your verified account details and place this
                order.
              </p>
              <Link className={primaryButton} href="/login?next=%2Fcheckout">
                Sign in to place order
              </Link>
            </div>
          )}
        </section>
        <aside className={checkoutCard}>
          <div className={checkoutTitle}>
            <i aria-hidden="true">2</i>
            <div>
              <h2>Order summary</h2>
              <p>Review your digital package and final payable amount.</p>
            </div>
          </div>
          <ProductRows products={products} compact />
          <form
            className="my-4 grid grid-cols-[1fr_5rem] gap-[.45rem]"
            onSubmit={apply}
          >
            <input
              className={checkoutInput}
              value={coupon}
              onChange={(event) =>
                setCoupon(normalizeCoupon(event.target.value))
              }
              placeholder="Coupon code"
              aria-label="Coupon code"
              maxLength={60}
            />
            <button
              className="cursor-pointer rounded-[.35rem] border-0 bg-[#ffebe3] font-bold text-[#e64a17] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={
                !account ||
                !coupon.trim() ||
                Boolean(busy) ||
                coupon === preview?.couponCode
              }
            >
              {busy === "coupon"
                ? "Updating…"
                : coupon === preview?.couponCode
                  ? "Applied"
                  : "Apply"}
            </button>
            {preview?.couponCode ? (
              <p className={appliedCoupon}>
                <span>
                  <b>{preview.couponCode}</b> applied
                </span>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={removeCoupon}
                >
                  Remove
                </button>
              </p>
            ) : null}
          </form>
          {preview ? (
            <PriceSummary preview={preview} itemCount={products.length} />
          ) : null}
          <div className="my-4 flex gap-[.7rem] bg-[#f6f8fa] p-[.8rem] text-[.68rem]">
            <b
              className="grid size-[1.55rem] shrink-0 place-items-center rounded-full bg-[#e7f6eb] text-[#24743b]"
              aria-hidden="true"
            >
              ✓
            </b>
            <span className="block">
              <strong>Secure payment powered by Razorpay</strong>
              <small className="mt-1 block text-[#777]">
                Your payment information is encrypted and secure.
              </small>
            </span>
          </div>
          <button
            className={`${primaryButton} w-full`}
            disabled={
              !account ||
              !phoneValid ||
              !preview ||
              products.length === 0 ||
              Boolean(busy)
            }
            onClick={placeOrder}
          >
            {busy === "order"
              ? "Creating order…"
              : `Place order & pay${preview ? ` ${formatMoney(preview.totalPaise, preview.currency)}` : ""} →`}
          </button>
          {error ? (
            <p className={dangerNotice} role="alert">
              {error}
            </p>
          ) : null}
        </aside>
      </div>
    </>
  );
}

export function RemovePurchasedCartItems({
  productIds,
}: {
  productIds: string[];
}) {
  useEffect(() => {
    const purchased = new Set(productIds);
    const current = readCart();
    const remaining = current.filter((id) => !purchased.has(id));
    if (remaining.length !== current.length) {
      writeCart(remaining);
      if (!remaining.length) writeCoupon("");
    }
  }, [productIds]);
  return null;
}
