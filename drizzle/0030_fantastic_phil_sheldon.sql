CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "status" "review_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "moderation_note" text;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "moderated_by" uuid;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "moderated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_reviews_moderation_idx" ON "product_reviews" USING btree ("status","updated_at");