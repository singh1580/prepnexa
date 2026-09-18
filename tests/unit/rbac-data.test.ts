import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSION_KEYS, SYSTEM_ROLES } from "../../src/db/seeds/rbac-data";

describe("RBAC seed data", () => {
  it("uses unique role and permission keys", () => {
    expect(new Set(SYSTEM_ROLES.map((role) => role.key)).size).toBe(SYSTEM_ROLES.length);
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  it("does not assign undefined permissions", () => {
    const known = new Set<string>(PERMISSIONS);
    for (const keys of Object.values(ROLE_PERMISSION_KEYS)) {
      for (const key of keys) expect(known.has(key)).toBe(true);
    }
  });
});
