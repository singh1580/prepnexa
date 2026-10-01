ALTER TABLE "products" ADD COLUMN "syllabus" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "language" varchar(30) DEFAULT 'BILINGUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cover_object_key" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cover_file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cover_content_type" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_language_check" CHECK ("products"."language" in ('ENGLISH','HINDI','BILINGUAL'));