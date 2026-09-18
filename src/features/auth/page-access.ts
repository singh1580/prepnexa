import { redirect } from "next/navigation";
import { getCurrentAuth } from "./authorization";
import { ADMIN_ROLE_KEYS } from "./constants";
import { findActiveTotpFactor } from "./repository";

export async function requireWorkspace(adminOnly = false) {
  const auth = await getCurrentAuth();
  if (!auth) redirect("/login?reason=session");
  const admin = auth.roles.some(role => ADMIN_ROLE_KEYS.has(role));
  if (adminOnly && !admin) redirect("/access-denied");
  if (!admin && !auth.roles.includes("STUDENT")) redirect("/access-denied");
  if (admin && !await findActiveTotpFactor(auth.user.id)) redirect("/login?reason=session");
  return { ...auth, admin };
}

export async function requireWorkspacePermission(permission: string) {
  const auth = await requireWorkspace(true);
  if (!auth.permissions.includes(permission)) redirect("/access-denied");
  return auth;
}

export async function requireAnyWorkspacePermission(permissions: readonly string[]) {
  const auth = await requireWorkspace(true);
  if (!permissions.some((permission) => auth.permissions.includes(permission))) redirect("/access-denied");
  return auth;
}
