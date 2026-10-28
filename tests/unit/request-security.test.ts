import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://prepstore.in",
  },
}));

import { enforceSameOriginRequest } from "@/lib/http/request-security";

describe("unsafe request origin protection", () => {
  it("allows safe requests", () => {
    expect(() => enforceSameOriginRequest(new Request("https://prepstore.in/api/health"))).not.toThrow();
  });

  it("allows same-origin browser mutations", () => {
    const request = new Request("https://prepstore.in/api/auth/profile", {
      method: "POST",
      headers: { origin: "https://prepstore.in", "sec-fetch-site": "same-origin" },
    });
    expect(() => enforceSameOriginRequest(request)).not.toThrow();
  });

  it("blocks cross-site and sibling-subdomain mutations", () => {
    for (const origin of ["https://evil.example", "https://uploads.prepstore.in"]) {
      const request = new Request("https://prepstore.in/api/auth/profile", {
        method: "POST",
        headers: { origin, "sec-fetch-site": origin.includes("prepstore.in") ? "same-site" : "cross-site" },
      });
      expect(() => enforceSameOriginRequest(request)).toThrowError(/blocked/i);
    }
  });

  it("keeps signed provider webhooks available to server-to-server calls", () => {
    const request = new Request("https://prepstore.in/api/commerce/webhooks/razorpay", { method: "POST" });
    expect(() => enforceSameOriginRequest(request)).not.toThrow();
  });
});
