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

  it("defines only the approved Student and Admin roles", () => {
    expect(SYSTEM_ROLES.map((role) => role.key)).toEqual(["STUDENT", "ADMIN"]);
  });

  it("gives the single Admin every platform-management capability", () => {
    expect(ROLE_PERMISSION_KEYS.ADMIN).toEqual(expect.arrayContaining(["exam.manage", "question.create", "question.publish", "product.manage", "user.read.support", "support.manage.all", "notification.manage", "order.read.all", "refund.manage", "coupon.manage", "audit.read", "system.manage"]));
    expect(ROLE_PERMISSION_KEYS.STUDENT).not.toContain("system.manage");
  });
});
