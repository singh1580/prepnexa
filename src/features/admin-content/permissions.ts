export const CONTENT_PERMISSIONS = {
  createQuestions: "question.create",
  manageTests: "test.manage",
  manageSchedules: "schedule.manage",
  manageMaterials: "material.manage",
  manageProducts: "product.manage",
} as const;

export const ADMIN_CONTENT_PERMISSION_KEYS = Object.values(CONTENT_PERMISSIONS);

export function hasAnyContentPermission(permissions: readonly string[]) {
  return ADMIN_CONTENT_PERMISSION_KEYS.some((permission) => permissions.includes(permission));
}
