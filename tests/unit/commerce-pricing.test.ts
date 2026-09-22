import { describe, expect, it } from "vitest";
import { calculateDiscount, normalizeCouponCode } from "../../src/features/commerce/pricing";
import { checkoutInputSchema, couponInputSchema } from "../../src/features/commerce/validation";

describe("commerce pricing", () => {
  it("calculates fixed and percentage discounts without floating point drift", () => {
    expect(calculateDiscount(99_900, { type: "FIXED", value: 20_000, maxDiscountPaise: null })).toBe(20_000);
    expect(calculateDiscount(99_900, { type: "PERCENT", value: 1250, maxDiscountPaise: null })).toBe(12_487);
    expect(calculateDiscount(99_900, { type: "PERCENT", value: 5000, maxDiscountPaise: 10_000 })).toBe(10_000);
  });

  it("never creates a negative payable amount", () => {
    expect(calculateDiscount(10_000, { type: "FIXED", value: 50_000, maxDiscountPaise: null })).toBe(10_000);
    expect(normalizeCouponCode("  welcome_25 ")).toBe("WELCOME_25");
  });

  it("validates coupon limits and percentage basis points", () => {
    const valid = { code: "TCS25", type: "PERCENT", value: 2500, currency: "INR", minOrderPaise: 0, perUserLimit: 1, active: true, productIds: [] };
    expect(couponInputSchema.safeParse(valid).success).toBe(true);
    expect(couponInputSchema.safeParse({ ...valid, value: 10_001 }).success).toBe(false);
    expect(couponInputSchema.safeParse({ ...valid, startsAt: "2026-10-02T00:00:00Z", endsAt: "2026-10-01T00:00:00Z" }).success).toBe(false);
  });

  it("requires a client idempotency key for checkout", () => {
    const productId = crypto.randomUUID();
    expect(checkoutInputSchema.safeParse({ productId, couponCode: "save10", idempotencyKey: crypto.randomUUID() }).success).toBe(true);
    expect(checkoutInputSchema.safeParse({ productId, idempotencyKey: "short" }).success).toBe(false);
  });
});
