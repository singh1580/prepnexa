import { describe, expect, it } from "vitest";
import { envSchema } from "@/config/env";

const base = {
  NEXT_PUBLIC_APP_URL: "https://prepstore.in",
  DATABASE_URL: "postgresql://test:test@localhost/test",
  DATABASE_URL_UNPOOLED: "postgresql://test:test@localhost/test",
  AUTH_SECRET: "unit-test-auth-secret-with-32-characters",
  PASSWORD_PEPPER: "unit-test-password-pepper",
};
const productionBase = {
  ...base,
  NODE_ENV: "production" as const,
  MFA_ENCRYPTION_KEY: "unit-test-mfa-encryption-key-32-characters",
  STORAGE_PROVIDER: "s3" as const,
  STORAGE_BUCKET: "prepstore-private",
  STORAGE_REGION: "ap-south-1",
  STORAGE_ACCESS_KEY_ID: "test-access-key",
  STORAGE_SECRET_ACCESS_KEY: "test-secret-key",
  RESEND_API_KEY: "re_test_key",
  EMAIL_FROM: "Prepstore <no-reply@prepstore.in>",
  PAYMENT_PROVIDER: "razorpay" as const,
  RAZORPAY_KEY_ID: "rzp_live_example",
  RAZORPAY_KEY_SECRET: "live_secret_value",
  RAZORPAY_WEBHOOK_SECRET: "webhook_secret_value",
};

describe("email environment validation", () => {
  it("accepts the verified Prepstore sender with a Resend key", () => {
    expect(envSchema.safeParse({
      ...productionBase,
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
      ...productionBase,
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
    expect(envSchema.safeParse({ ...productionBase, PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_example", RAZORPAY_KEY_SECRET: "live_secret_value", RAZORPAY_WEBHOOK_SECRET: undefined }).success).toBe(false);
    expect(envSchema.safeParse({ ...productionBase, PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_example", RAZORPAY_KEY_SECRET: "live_secret_value", RAZORPAY_WEBHOOK_SECRET: "webhook_secret_value" }).success).toBe(true);
  });
});

describe("production security environment validation", () => {
  it("requires HTTPS, encrypted MFA secrets and private object storage", () => {
    expect(envSchema.safeParse({ ...productionBase, NEXT_PUBLIC_APP_URL: "http://prepstore.in" }).success).toBe(false);
    expect(envSchema.safeParse({ ...productionBase, MFA_ENCRYPTION_KEY: undefined }).success).toBe(false);
    expect(envSchema.safeParse({ ...productionBase, STORAGE_PROVIDER: "local" }).success).toBe(false);
    expect(envSchema.safeParse(productionBase).success).toBe(true);
  });

  it("rejects mock payment or disabled transactional email in production", () => {
    expect(envSchema.safeParse({ ...productionBase, PAYMENT_PROVIDER: "mock" }).success).toBe(false);
    expect(envSchema.safeParse({ ...productionBase, RESEND_API_KEY: undefined, EMAIL_FROM: undefined }).success).toBe(false);
  });
});
