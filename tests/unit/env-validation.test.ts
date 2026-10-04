import { describe, expect, it } from "vitest";
import { envSchema } from "@/config/env";

const base = {
  NEXT_PUBLIC_APP_URL: "https://prepstore.in",
  DATABASE_URL: "postgresql://test:test@localhost/test",
  DATABASE_URL_UNPOOLED: "postgresql://test:test@localhost/test",
  AUTH_SECRET: "unit-test-auth-secret-with-32-characters",
  PASSWORD_PEPPER: "unit-test-password-pepper",
};

describe("email environment validation", () => {
  it("accepts the verified Prepstore sender with a Resend key", () => {
    expect(envSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "Prepstore <no-reply@prepstore.in>",
    }).success).toBe(true);
  });

  it("rejects partial Resend configuration", () => {
    const result = envSchema.safeParse({ ...base, RESEND_API_KEY: "re_test_key" });
    expect(result.success).toBe(false);
  });

  it("rejects the Resend test domain in production", () => {
    const result = envSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "Prepstore <onboarding@resend.dev>",
    });
    expect(result.success).toBe(false);
  });
});

describe("payment environment validation", () => {
  it("requires Razorpay credentials when the provider is selected", () => {
    expect(envSchema.safeParse({ ...base, PAYMENT_PROVIDER: "razorpay" }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_test_example", RAZORPAY_KEY_SECRET: "test_secret_value" }).success).toBe(true);
  });

  it("requires a Razorpay webhook secret in production", () => {
    expect(envSchema.safeParse({ ...base, NODE_ENV: "production", PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_example", RAZORPAY_KEY_SECRET: "live_secret_value" }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, NODE_ENV: "production", PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_example", RAZORPAY_KEY_SECRET: "live_secret_value", RAZORPAY_WEBHOOK_SECRET: "webhook_secret_value" }).success).toBe(true);
  });
});
