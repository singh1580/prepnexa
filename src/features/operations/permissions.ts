export const OPERATIONS_PERMISSIONS = {
  readStudents: "user.read.support",
  manageStudents: "system.manage",
  manageSupport: "support.manage.all",
  manageNotifications: "notification.manage",
  readAudit: "audit.read",
  manageSystem: "system.manage",
} as const;

export function hasAnyOperationsPermission(permissions: readonly string[]) {
  return Object.values(OPERATIONS_PERMISSIONS).some((permission) => permissions.includes(permission));
}
