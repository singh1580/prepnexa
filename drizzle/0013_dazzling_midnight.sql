ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "question_revisions" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD COLUMN IF NOT EXISTS "image_url" text;
