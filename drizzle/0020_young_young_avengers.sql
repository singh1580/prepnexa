CREATE TABLE "notification_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience" varchar(40) NOT NULL,
	"product_id" uuid,
	"title" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_campaigns_audience_check" CHECK ("notification_campaigns"."audience" in ('ALL_STUDENTS','PACKAGE_CUSTOMERS','INACTIVE_STUDENTS')),
	CONSTRAINT "notification_campaigns_channel_check" CHECK ("notification_campaigns"."channel" in ('EMAIL','IN_APP')),
	CONSTRAINT "notification_campaigns_recipients_check" CHECK ("notification_campaigns"."recipient_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "notification_campaigns" ADD CONSTRAINT "notification_campaigns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_campaigns" ADD CONSTRAINT "notification_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_campaigns_created_idx" ON "notification_campaigns" USING btree ("created_at");