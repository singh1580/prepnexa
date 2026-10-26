import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const paymentUi = readFileSync(
  new URL(
    "../../src/features/commerce/ui/razorpay-payment.tsx",
    import.meta.url,
  ),
  "utf8",
);
const compactPaymentUi = paymentUi.replace(/\s+/g, "");

describe("Razorpay checkout script lifecycle", () => {
  it("becomes ready again when the checkout route remounts", () => {
    expect(compactPaymentUi).toContain(
      'strategy="afterInteractive"onReady={()=>setScriptReady(true)}',
    );
    expect(compactPaymentUi).not.toContain("onLoad={()=>setScriptReady(true)}");
  });

  it("allows an unopened checkout to be reopened after status recovery", () => {
    expect(paymentUi).toContain('setPaymentState("READY")');
    expect(paymentUi).not.toContain(
      'paymentState==="READY" || paymentState==="PENDING"',
    );
  });
});
