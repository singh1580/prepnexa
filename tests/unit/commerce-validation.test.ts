import { describe,expect,it } from "vitest";
import { checkoutInputSchema } from "@/features/commerce/validation";

const base={productId:"11111111-1111-4111-8111-111111111111",idempotencyKey:"11111111-1111-4111-8111-111111111111",couponCode:null};

describe("checkout mobile validation",()=>{
  it("normalizes supported Indian mobile formats",()=>{
    expect(checkoutInputSchema.parse({...base,phone:"98765 43210"}).phone).toBe("+919876543210");
    expect(checkoutInputSchema.parse({...base,phone:"+91 98765-43210"}).phone).toBe("+919876543210");
  });
  it("rejects a malformed mobile number while allowing free checkout to omit it",()=>{
    expect(checkoutInputSchema.parse({...base,phone:""}).phone).toBeNull();
    expect(()=>checkoutInputSchema.parse({...base,phone:"12345"})).toThrow();
    expect(()=>checkoutInputSchema.parse({...base,phone:"call 9876543210"})).toThrow();
  });
});
