ALTER TABLE "users" ADD COLUMN "class_level" varchar(120);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "board" varchar(120);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "target_exam" varchar(160);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "in_app_notifications" boolean DEFAULT true NOT NULL;