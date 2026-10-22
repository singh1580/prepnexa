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
  readSessionCookie,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/features/auth/session-cookie";

describe("Prepstore session cookie", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  it("reads only the Prepstore cookie", async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === SESSION_COOKIE ? { value: "prepstore-token" } : undefined,
    );
    await expect(readSessionCookie()).resolves.toBe("prepstore-token");
    expect(cookieStore.get).toHaveBeenCalledTimes(1);
    expect(cookieStore.get).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it("writes the Prepstore cookie on login", async () => {
    const expiresAt = new Date("2026-11-21T00:00:00.000Z");
    await setSessionCookie("new-token", expiresAt);

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      "new-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", expires: expiresAt }),
    );
  });

  it("expires the Prepstore cookie on logout", async () => {
    await clearSessionCookie();

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      "",
      expect.objectContaining({ expires: new Date(0) }),
    );
  });
});
