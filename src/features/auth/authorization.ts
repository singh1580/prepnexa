import { AppError } from "@/lib/errors/app-error";
import { hashIdentifier } from "./crypto";
import { findActiveSession, findAuthorizationForUser } from "./repository";
import { readSessionCookie } from "./session-cookie";
import { ADMIN_ROLE_KEYS } from "./constants";

export async function getCurrentAuth() {
  const token = await readSessionCookie();
  if (!token) return null;
  const session = await findActiveSession(hashIdentifier(token));
  if (!session || session.userStatus !== "ACTIVE") return null;
  const grants = await findAuthorizationForUser(session.userId);
  return {
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    user: { id: session.userId, name: session.userName, email: session.userEmail, emailVerified: Boolean(session.emailVerifiedAt) },
    roles: [...new Set(grants.map((grant) => grant.role))],
    permissions: [...new Set(grants.flatMap((grant) => grant.permission ? [grant.permission] : []))],
  };
}

export async function requireAuthenticated() {
  const auth = await getCurrentAuth();
  if (!auth) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  return auth;
}

export async function requirePermission(permission: string) {
  const auth = await requireAuthenticated();
  if (!auth.permissions.includes(permission)) throw new AppError("FORBIDDEN", "You do not have permission to perform this action.", 403);
  return auth;
}

export async function requireAdmin() {
  const auth = await requireAuthenticated();
  if (!auth.roles.some((role) => ADMIN_ROLE_KEYS.has(role))) throw new AppError("FORBIDDEN", "Administrator access is required.", 403);
  return auth;
}
