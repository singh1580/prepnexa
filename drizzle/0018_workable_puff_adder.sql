ALTER TABLE "attempt_answers" ADD COLUMN IF NOT EXISTS "time_spent_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'attempt_answers_time_check'
	) THEN
		ALTER TABLE "attempt_answers"
			ADD CONSTRAINT "attempt_answers_time_check"
			CHECK ("attempt_answers"."time_spent_seconds" >= 0);
	END IF;
END $$;
