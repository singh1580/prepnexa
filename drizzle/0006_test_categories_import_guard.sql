CREATE TYPE "public"."test_category" AS ENUM('FULL_MOCK', 'SUBJECT_TEST', 'TOPIC_SET');--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "category" "test_category";--> statement-breakpoint
ALTER TABLE "content_import_jobs" ADD COLUMN "import_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "content_import_jobs_import_key_uq" ON "content_import_jobs" USING btree ("import_key");