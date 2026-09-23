ALTER TABLE "notifications" ADD COLUMN "deduplication_key" varchar(180);--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_uq" ON "notifications" USING btree ("deduplication_key");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_channel_uq" ON "notification_deliveries" USING btree ("notification_id","channel");
