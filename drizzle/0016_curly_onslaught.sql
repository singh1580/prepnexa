ALTER TABLE "exams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "topics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "topic_results" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "exams" CASCADE;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;--> statement-breakpoint
DROP TABLE "topics" CASCADE;--> statement-breakpoint
DROP TABLE "topic_results" CASCADE;--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_reviewed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "question_revisions" DROP CONSTRAINT "question_revisions_reviewed_by_users_id_fk";
--> statement-breakpoint
DO $migration$
BEGIN
  EXECUTE 'ALTER TABLE "materials" DROP CONSTRAINT "materials_download_type_check"';
  EXECUTE 'ALTER TABLE "materials" ALTER COLUMN "type" SET DATA TYPE text USING "type"::text';
  EXECUTE 'DROP TYPE "public"."material_type"';
  EXECUTE 'CREATE TYPE "public"."material_type" AS ENUM (''PDF'', ''VIDEO'', ''FILE'')';
  EXECUTE 'ALTER TABLE "materials" ALTER COLUMN "type" SET DATA TYPE "public"."material_type" USING "type"::text::"public"."material_type"';
  EXECUTE 'ALTER TABLE "materials" ADD CONSTRAINT "materials_download_type_check" CHECK ((NOT "allow_download") OR "type" IN (''PDF'', ''FILE''))';
END
$migration$;--> statement-breakpoint
DROP INDEX "questions_topic_status_idx";--> statement-breakpoint
DROP INDEX "tests_mode_status_idx";--> statement-breakpoint
CREATE INDEX "questions_updated_idx" ON "questions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "tests_mode_idx" ON "tests" USING btree ("mode");--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "exam_id";--> statement-breakpoint
ALTER TABLE "materials" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "topic_id";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "reviewed_by";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "tests" DROP COLUMN "exam_id";--> statement-breakpoint
ALTER TABLE "tests" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "material_versions" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "question_revisions" DROP COLUMN "reviewed_by";--> statement-breakpoint
ALTER TABLE "question_revisions" DROP COLUMN "published_at";--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" DROP COLUMN "topic_id";--> statement-breakpoint
DROP TYPE "public"."content_status";
