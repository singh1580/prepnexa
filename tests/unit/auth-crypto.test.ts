import { describe, expect, it } from "vitest";

process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost/placeholder";
process.env.DATABASE_URL_UNPOOLED = "postgresql://placeholder:placeholder@localhost/placeholder";
process.env.AUTH_SECRET = "12345678901234567890123456789012";
process.env.PASSWORD_PEPPER = "1234567890123456";
process.env.MFA_ENCRYPTION_KEY = "abcdefghijklmnopqrstuvwxyz123456";

describe("auth cryptography", () => {
  it("round-trips an encrypted MFA secret", async () => {
    const { decryptMfaSecret, encryptMfaSecret } = await import("../../src/features/auth/crypto");
    const encrypted = encryptMfaSecret("JBSWY3DPEHPK3PXP");
    expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptMfaSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("creates unique one-time recovery codes", async () => {
    const { createRecoveryCodes } = await import("../../src/features/auth/crypto");
    const codes = createRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });
});
