import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cartWorkflow = readFileSync(
  new URL("../../src/features/commerce/ui/cart-workflow.tsx", import.meta.url),
  "utf8",
);

describe("cart coupon experience", () => {
  it("persists only the coupon code and revalidates it through checkout preview", () => {
    expect(cartWorkflow).toContain('couponStorageKey="prepstore-cart-coupon-v1"');
    expect(cartWorkflow).toContain("localStorage.setItem(couponStorageKey,normalized)");
    expect(cartWorkflow).toContain('commerceRequest<Preview>("commerce/checkout/preview"');
    expect(cartWorkflow).not.toContain("localStorage.setItem(couponStorageKey,JSON.stringify(preview))");
  });

  it("offers an explicit remove action on cart and checkout", () => {
    expect(cartWorkflow).toContain("async function removeCoupon()");
    expect(cartWorkflow).toContain('couponCode:null');
    expect(cartWorkflow).toContain('>Remove</button>');
    expect(cartWorkflow).toContain('router.replace("/checkout",{scroll:false})');
  });
});
