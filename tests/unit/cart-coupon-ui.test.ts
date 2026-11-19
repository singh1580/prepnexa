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

  it("collects a missing mobile number once and reuses the saved profile value", () => {
    expect(compactWorkflow).toContain('type="tel"inputMode="numeric"');
    expect(compactWorkflow).toContain("phone:normalizedPhone");
    expect(compactWorkflow).toContain("readOnly={Boolean(savedPhone)}");
    expect(compactWorkflow).toContain("saveittoyourprofileforfuturepurchases");
    expect(compactWorkflow).toContain('href="/account/profile"');
  });

  it("explains blocked checkout actions instead of leaving a disabled dead end", () => {
    expect(compactWorkflow).toContain("phoneInputRef.current?.focus()");
    expect(compactWorkflow).toContain("AddavalidmobilenumberinBillingdetailstocontinue.");
    expect(compactWorkflow).toContain('href="/login?next=%2Fcheckout">Signintocontinue');
    expect(compactWorkflow).not.toContain("disabled={!account||!phoneValid");
  });
});
