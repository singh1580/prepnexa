import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("@/config/env", () => ({
  env: { NODE_ENV: "test" },
}));

import {
  clearSessionCookie,
  LEGACY_SESSION_COOKIE,
  readSessionCookie,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/features/auth/session-cookie";

describe("Prepstore session cookie migration", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  it("prefers the Prepstore cookie and falls back to an existing legacy session", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === SESSION_COOKIE ? undefined : { value: "legacy-token" },
    );
    await expect(readSessionCookie()).resolves.toBe("legacy-token");

    cookieStore.get.mockImplementation((name: string) =>
      name === SESSION_COOKIE ? { value: "prepstore-token" } : { value: "legacy-token" },
    );
    await expect(readSessionCookie()).resolves.toBe("prepstore-token");
  });

  it("writes the Prepstore cookie and expires the legacy name on login", async () => {
    const expiresAt = new Date("2026-11-21T00:00:00.000Z");
    await setSessionCookie("new-token", expiresAt);

    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      SESSION_COOKIE,
      "new-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", expires: expiresAt }),
    );
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      2,
      LEGACY_SESSION_COOKIE,
      "",
      expect.objectContaining({ expires: new Date(0) }),
    );
  });

  it("expires both cookie names on logout", async () => {
    await clearSessionCookie();

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      "",
      expect.objectContaining({ expires: new Date(0) }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      LEGACY_SESSION_COOKIE,
      "",
      expect.objectContaining({ expires: new Date(0) }),
    );
  });
});
