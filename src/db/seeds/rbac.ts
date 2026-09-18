import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { PERMISSIONS, ROLE_PERMISSION_KEYS, SYSTEM_ROLES } from "./rbac-data";

export async function seedRbac() {
  await db.insert(roles).values(SYSTEM_ROLES.map((role) => ({ ...role, isSystem: true }))).onConflictDoNothing({ target: roles.key });
  await db.insert(permissions).values(PERMISSIONS.map((key) => ({ key }))).onConflictDoNothing({ target: permissions.key });

  const storedRoles = await db.select({ id: roles.id, key: roles.key }).from(roles).where(inArray(roles.key, SYSTEM_ROLES.map((role) => role.key)));
  const storedPermissions = await db.select({ id: permissions.id, key: permissions.key }).from(permissions).where(inArray(permissions.key, [...PERMISSIONS]));
  const permissionIds = new Map(storedPermissions.map((permission) => [permission.key, permission.id]));

  for (const role of storedRoles) {
    const keys = ROLE_PERMISSION_KEYS[role.key as keyof typeof ROLE_PERMISSION_KEYS];
    if (!keys) continue;
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    const values = keys.map((key) => ({ roleId: role.id, permissionId: required(permissionIds, key) }));
    if (values.length) await db.insert(rolePermissions).values(values);
  }
}

function required(values: Map<string, string>, key: string) {
  const value = values.get(key);
  if (!value) throw new Error(`Missing seeded permission: ${key}`);
  return value;
}
