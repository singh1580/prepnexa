import { describe, expect, it } from "vitest";
import { loginInputSchema, registerInputSchema } from "../../src/features/auth/validation";

describe("auth validation", () => {
  it("normalizes an email during registration", () => {
    const result = registerInputSchema.parse({ name: "Learner", email: "  USER@Example.COM ", password: "a-secure-password" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects short passwords", () => {
    expect(() => loginInputSchema.parse({ email: "user@example.com", password: "short" })).toThrow();
  });
});
