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
  it("accepts the verified PrepNexa sender with a Resend key", () => {
    expect(envSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "PrepNexa <no-reply@prepstore.in>",
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
      EMAIL_FROM: "PrepNexa <onboarding@resend.dev>",
    });
    expect(result.success).toBe(false);
  });
});
