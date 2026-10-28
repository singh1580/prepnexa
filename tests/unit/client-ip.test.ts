import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/http/client-ip";

describe("client IP extraction", () => {
  it("prefers the reverse proxy controlled real IP", () => {
    const request = new Request("https://prepstore.in", {
      headers: {
        "x-real-ip": "203.0.113.9",
        "x-forwarded-for": "198.51.100.5, 10.0.0.2",
      },
    });
    expect(clientIp(request)).toBe("203.0.113.9");
  });

  it("uses the right-most forwarded address when real IP is unavailable", () => {
    const request = new Request("https://prepstore.in", {
      headers: { "x-forwarded-for": "198.51.100.5, 203.0.113.9" },
    });
    expect(clientIp(request)).toBe("203.0.113.9");
  });
});
