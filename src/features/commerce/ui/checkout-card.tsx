"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddToCartButton, addCartItem } from "./cart-workflow";

const purchaseGrid =
  "mt-[1.2rem] grid grid-cols-2 gap-[.65rem] max-[560px]:grid-cols-1 [&>small]:col-span-full [&>small]:text-[.66rem] [&>small]:text-[#777] max-[560px]:[&>small]:col-span-1";
const outlineButton =
  "flex min-h-12 cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-white px-4 py-[.7rem] text-[.8rem] font-[760] text-prep-orange hover:bg-prep-orange-soft";
const primaryButton =
  "flex min-h-12 cursor-pointer items-center justify-center rounded-[.35rem] border border-prep-orange bg-prep-orange px-4 py-[.7rem] text-[.8rem] font-[760] text-white hover:border-prep-orange-dark hover:bg-prep-orange-dark";

export function CheckoutCard({
  productId,
  slug,
  pricePaise,
  owned = false,
}: {
  productId: string;
  slug: string;
  pricePaise: number;
  owned?: boolean;
}) {
  const router = useRouter();
  function buyNow() {
    addCartItem(productId);
    router.push("/checkout");
  }
  if (owned)
    return (
      <div className={purchaseGrid}>
        <span className="flex min-h-12 items-center justify-center rounded-[.4rem] border border-[#b9ddc4] bg-[#effaf2] text-[.76rem] font-extrabold text-[#27733e]">
          ✓ Already purchased
        </span>
        <Link className={primaryButton} href={`/dashboard/courses/${slug}`}>
          Open package →
        </Link>
        <small>This package is already available in My Packages.</small>
      </div>
    );
  return (
    <div className={purchaseGrid}>
      <AddToCartButton productId={productId} className={outlineButton} />
      <button className={primaryButton} type="button" onClick={buyNow}>
        {pricePaise === 0 ? "Get access" : "Buy now"}
      </button>
      <small>Final payable price is verified securely at checkout.</small>
    </div>
  );
}
