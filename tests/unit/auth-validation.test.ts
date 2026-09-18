import { describe, expect, it } from "vitest";
import { loginInputSchema, mfaLoginInputSchema, registerInputSchema, resetPasswordInputSchema } from "../../src/features/auth/validation";

describe("auth validation", () => {
  it("normalizes an email during registration", () => {
    const result = registerInputSchema.parse({ name: "Learner", email: "  USER@Example.COM ", password: "a-secure-password" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects short passwords", () => {
    expect(() => loginInputSchema.parse({ email: "user@example.com", password: "short" })).toThrow();
  });

  it("requires an opaque reset token", () => {
    expect(() => resetPasswordInputSchema.parse({ token: "short", password: "a-secure-password" })).toThrow();
  });

  it("accepts exactly one MFA proof", () => {
    const challengeToken = "x".repeat(43);
    expect(mfaLoginInputSchema.parse({ challengeToken, code: "123456" }).code).toBe("123456");
    expect(() => mfaLoginInputSchema.parse({ challengeToken, code: "123456", recoveryCode: "ABCDEF-123456" })).toThrow();
  });
});
