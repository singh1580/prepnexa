export const SYSTEM_ROLES = [
  { key: "STUDENT", name: "Student" },
  { key: "ADMIN", name: "Admin" },
] as const;

export const PERMISSIONS = [
  "profile.read.self", "profile.update.self", "session.manage.self",
  "catalog.read", "test.attempt", "result.read.self", "material.access", "order.read.self", "support.manage.self",
  "question.create", "test.manage", "schedule.manage", "material.manage", "product.manage",
  "user.read.support", "support.manage.all", "notification.manage",
  "order.read.all", "payment.read", "refund.manage", "reconciliation.manage", "invoice.read.all", "coupon.manage",
  "audit.read", "security.read", "system.manage",
] as const;

export const ROLE_PERMISSION_KEYS: Record<(typeof SYSTEM_ROLES)[number]["key"], readonly string[]> = {
  STUDENT: ["profile.read.self","profile.update.self","session.manage.self","catalog.read","test.attempt","result.read.self","material.access","order.read.self","support.manage.self"],
  ADMIN: ["catalog.read","question.create","test.manage","schedule.manage","material.manage","product.manage","user.read.support","support.manage.all","notification.manage","order.read.all","payment.read","refund.manage","reconciliation.manage","invoice.read.all","coupon.manage","audit.read","security.read","system.manage"],
};
