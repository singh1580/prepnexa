import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/config/security-headers";

describe("security headers", () => {
  it("blocks framing and MIME sniffing on every response", () => {
    expect(SECURITY_HEADERS).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    expect(SECURITY_HEADERS).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
  });

  it("uses privacy-preserving browser policies", () => {
    expect(SECURITY_HEADERS).toContainEqual({ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" });
    expect(SECURITY_HEADERS).toContainEqual({ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" });
  });
});
