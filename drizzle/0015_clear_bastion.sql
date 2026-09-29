ALTER TABLE "materials" ALTER COLUMN "exam_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "topic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "exam_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "attempt_question_snapshots" ALTER COLUMN "topic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_live" boolean DEFAULT false NOT NULL;