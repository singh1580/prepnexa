ALTER TABLE "notifications" ADD COLUMN "deduplication_key" varchar(180);--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_uq" ON "notifications" USING btree ("deduplication_key");--> statement-breakpoint
