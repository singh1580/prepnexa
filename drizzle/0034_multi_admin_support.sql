-- Prepstore supports multiple Admin accounts. Authorization remains permission-based,
-- and every Admin must still complete the existing MFA flow.
DROP TRIGGER IF EXISTS enforce_single_prepnexa_admin_trigger ON "user_roles";
--> statement-breakpoint
DROP FUNCTION IF EXISTS enforce_single_prepnexa_admin();
--> statement-breakpoint
DROP INDEX IF EXISTS user_roles_single_admin_uq;
--> statement-breakpoint
UPDATE "roles"
SET "name" = 'Admin', "description" = 'Prepstore administrator', "is_system" = true
WHERE "key" = 'ADMIN';
