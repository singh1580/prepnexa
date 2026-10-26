import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cartWorkflow = readFileSync(
  new URL("../../src/features/commerce/ui/cart-workflow.tsx", import.meta.url),
  "utf8",
);
const compactWorkflow = cartWorkflow.replace(/\s+/g, "");

describe("cart coupon experience", () => {
  it("persists only the coupon code and revalidates it through checkout preview", () => {
    expect(compactWorkflow).toContain(
      'couponStorageKey="prepstore-cart-coupon-v1"',
    );
    expect(compactWorkflow).toContain(
      "localStorage.setItem(couponStorageKey,normalized)",
    );
    expect(compactWorkflow).toContain(
      'commerceRequest<Preview>("commerce/checkout/preview"',
    );
    expect(compactWorkflow).not.toContain(
      "localStorage.setItem(couponStorageKey,JSON.stringify(preview))",
    );
  });

  it("offers an explicit remove action on cart and checkout", () => {
    expect(compactWorkflow).toContain("asyncfunctionremoveCoupon()");
    expect(compactWorkflow).toContain("couponCode:null");
    expect(compactWorkflow).toContain(">Remove</button>");
    expect(compactWorkflow).toContain(
      'router.replace("/checkout",{scroll:false})',
    );
  });

  it("collects the paid-order mobile number and sends the normalized value", () => {
    expect(compactWorkflow).toContain('type="tel"inputMode="numeric"');
    expect(compactWorkflow).toContain("phone:normalizedPhone");
    expect(compactWorkflow).not.toContain(
      'value={account.phone??"Notaddedtoyourprofile"}readOnly',
    );
  });
});
