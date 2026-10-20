import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

const paymentUi=readFileSync(new URL("../../src/features/commerce/ui/razorpay-payment.tsx",import.meta.url),"utf8");

describe("Razorpay checkout script lifecycle",()=>{
  it("becomes ready again when the checkout route remounts",()=>{
    expect(paymentUi).toContain('strategy="afterInteractive" onReady={() => setScriptReady(true)}');
    expect(paymentUi).not.toContain("onLoad={() => setScriptReady(true)}");
  });

  it("allows an unopened checkout to be reopened after status recovery",()=>{
    expect(paymentUi).toContain('setPaymentState("READY")');
    expect(paymentUi).not.toContain('paymentState==="READY" || paymentState==="PENDING"');
  });
});
