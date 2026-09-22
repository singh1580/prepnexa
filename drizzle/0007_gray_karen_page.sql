ALTER TABLE "attempt_answers" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD COLUMN "topic_id" uuid;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD COLUMN "type" "question_type";--> statement-breakpoint
UPDATE "attempt_question_snapshots" AS snapshot SET "topic_id" = question."topic_id", "type" = question."type"
FROM "questions" AS question WHERE question."id" = snapshot."question_id";--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "topic_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ADD CONSTRAINT "attempt_question_snapshots_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
WITH ranked_active AS (
  SELECT "id", row_number() OVER (PARTITION BY "user_id" ORDER BY "created_at" DESC, "id" DESC) AS position
  FROM "attempts" WHERE "status" IN ('CREATED','IN_PROGRESS')
)
UPDATE "attempts" SET "status" = 'AUTO_SUBMITTED', "submitted_at" = COALESCE("submitted_at", now()), "updated_at" = now()
WHERE "id" IN (SELECT "id" FROM ranked_active WHERE position > 1);--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_user_active_uq" ON "attempts" USING btree ("user_id") WHERE "attempts"."status" in ('CREATED','IN_PROGRESS');--> statement-breakpoint
CREATE INDEX "attempts_user_created_idx" ON "attempts" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_version_check" CHECK ("attempt_answers"."version" > 0);
