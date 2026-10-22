import { cookies } from "next/headers";
import { env } from "@/config/env";

export const SESSION_COOKIE = "prepstore_session";
export const LEGACY_SESSION_COOKIE = "prepnexa_session";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
  cookieStore.set(LEGACY_SESSION_COOKIE, "", { ...cookieOptions, expires: new Date(0) });
}

export async function readSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  for (const name of [SESSION_COOKIE, LEGACY_SESSION_COOKIE]) {
    cookieStore.set(name, "", { ...cookieOptions, expires: new Date(0) });
  }
}
