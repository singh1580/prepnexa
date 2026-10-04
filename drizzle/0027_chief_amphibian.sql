DROP INDEX IF EXISTS "attempts_user_test_seq_uq";--> statement-breakpoint
DROP INDEX IF EXISTS "attempts_test_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "test_sections_order_uq";--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "product_id" uuid;--> statement-breakpoint
ALTER TABLE "test_sections" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "material_access_logs" ADD COLUMN IF NOT EXISTS "product_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attempts_product_id_products_id_fk') THEN
    ALTER TABLE "attempts" ADD CONSTRAINT "attempts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_access_logs_product_id_products_id_fk') THEN
    ALTER TABLE "material_access_logs" ADD CONSTRAINT "material_access_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
-- Legacy attempts predate package-scoped test progress. Prefer a package the
-- student owned when the attempt was created, then fall back to any package
-- containing the test so historical results remain reachable.
UPDATE "attempts" a
SET "product_id" = (
  SELECT pt."product_id"
  FROM "product_tests" pt
  LEFT JOIN "entitlements" e
    ON e."product_id" = pt."product_id"
   AND e."user_id" = a."user_id"
   AND e."starts_at" <= a."started_at"
   AND (e."expires_at" IS NULL OR e."expires_at" > a."started_at")
  WHERE pt."test_id" = a."test_id"
  ORDER BY (e."id" IS NOT NULL) DESC, pt."product_id"
  LIMIT 1
);--> statement-breakpoint
-- Material access history receives the same package context. Entitlement logs
-- are exact; free legacy logs use a deterministic containing package.
UPDATE "material_access_logs" mal
SET "product_id" = COALESCE(
  (SELECT e."product_id" FROM "entitlements" e WHERE e."id" = mal."entitlement_id"),
  (
    SELECT pm."product_id"
    FROM "product_materials" pm
    WHERE pm."material_id" = mal."material_id"
    ORDER BY pm."product_id"
    LIMIT 1
  )
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attempts_user_product_test_seq_uq" ON "attempts" USING btree ("user_id","product_id","test_id","sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_product_test_status_idx" ON "attempts" USING btree ("product_id","test_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_access_product_idx" ON "material_access_logs" USING btree ("user_id","product_id","material_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "test_sections_order_uq" ON "test_sections" USING btree ("test_id","sort_order") WHERE "test_sections"."is_active" = true;
