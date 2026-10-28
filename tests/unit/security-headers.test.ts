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

  it("enforces HTTPS and a restrictive content policy", () => {
    expect(SECURITY_HEADERS).toContainEqual({ key: "Strict-Transport-Security", value: "max-age=86400" });
    const csp = SECURITY_HEADERS.find((header) => header.key === "Content-Security-Policy")?.value;
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://checkout.razorpay.com");
  });
});
