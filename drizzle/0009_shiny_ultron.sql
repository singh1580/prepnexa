ALTER TABLE "material_access_logs" ALTER COLUMN "entitlement_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "allow_download" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "material_versions" ADD COLUMN "original_file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "material_versions" ADD COLUMN "content_type" varchar(120);--> statement-breakpoint
ALTER TABLE "material_access_logs" ADD COLUMN "access_source" varchar(20);--> statement-breakpoint
UPDATE "material_access_logs" SET "access_source" = CASE WHEN "entitlement_id" IS NULL THEN 'FREE' ELSE 'ENTITLEMENT' END;--> statement-breakpoint
ALTER TABLE "material_access_logs" ALTER COLUMN "access_source" SET NOT NULL;
