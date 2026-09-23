INSERT INTO "roles" ("id", "key", "name", "description", "is_system", "created_at")
VALUES (gen_random_uuid(), 'ADMIN', 'Admin', 'Single PrepNexa administrator', true, now())
ON CONFLICT ("key") DO UPDATE SET "name" = 'Admin', "description" = 'Single PrepNexa administrator', "is_system" = true;
--> statement-breakpoint
DO $$
DECLARE
  admin_role_id uuid;
  assigned_admins integer;
BEGIN
  SELECT "id" INTO admin_role_id FROM "roles" WHERE "key" = 'ADMIN';

  SELECT count(DISTINCT ur."user_id") INTO assigned_admins
  FROM "user_roles" ur
  JOIN "roles" r ON r."id" = ur."role_id"
  WHERE r."key" IN ('ADMIN', 'CONTENT_ADMIN');

  IF assigned_admins > 1 THEN
    RAISE EXCEPTION 'PrepNexa supports exactly one Admin; found % existing Admin assignments', assigned_admins;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "user_roles" ur
    JOIN "roles" r ON r."id" = ur."role_id"
    WHERE r."key" IN ('CONTENT_REVIEWER', 'SUPPORT_AGENT', 'FINANCE_ADMIN', 'SUPER_ADMIN')
  ) THEN
    RAISE EXCEPTION 'Legacy staff assignments require explicit removal before the Student/Admin migration';
  END IF;

  INSERT INTO "role_permissions" ("role_id", "permission_id")
  SELECT admin_role_id, rp."permission_id"
  FROM "role_permissions" rp
  JOIN "roles" r ON r."id" = rp."role_id"
  WHERE r."key" = 'CONTENT_ADMIN'
  ON CONFLICT DO NOTHING;

  INSERT INTO "user_roles" ("user_id", "role_id", "assigned_by", "assigned_at")
  SELECT ur."user_id", admin_role_id, ur."assigned_by", ur."assigned_at"
  FROM "user_roles" ur
  JOIN "roles" r ON r."id" = ur."role_id"
  WHERE r."key" = 'CONTENT_ADMIN'
  ON CONFLICT DO NOTHING;

  DELETE FROM "roles"
  WHERE "key" IN ('CONTENT_REVIEWER', 'CONTENT_ADMIN', 'SUPPORT_AGENT', 'FINANCE_ADMIN', 'SUPER_ADMIN');
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_single_prepnexa_admin() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "roles" WHERE "id" = NEW."role_id" AND "key" = 'ADMIN')
     AND EXISTS (SELECT 1 FROM "user_roles" WHERE "role_id" = NEW."role_id" AND "user_id" <> NEW."user_id") THEN
    RAISE EXCEPTION 'PrepNexa supports exactly one Admin account';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS enforce_single_prepnexa_admin_trigger ON "user_roles";
--> statement-breakpoint
CREATE TRIGGER enforce_single_prepnexa_admin_trigger
BEFORE INSERT OR UPDATE OF "user_id", "role_id" ON "user_roles"
FOR EACH ROW EXECUTE FUNCTION enforce_single_prepnexa_admin();
