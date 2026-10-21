CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(120) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20),
	"category" varchar(40) NOT NULL,
	"subject" varchar(180) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(30) DEFAULT 'NEW' NOT NULL,
	"email_delivery_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"provider_message_id" varchar(180),
	"last_error" text,
	"ip_hash" text,
	"request_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_inquiries_category_check" CHECK ("contact_inquiries"."category" in ('GENERAL','BUSINESS','CONTENT_PERMISSION','PRIVACY','GRIEVANCE')),
	CONSTRAINT "contact_inquiries_status_check" CHECK ("contact_inquiries"."status" in ('NEW','IN_REVIEW','RESOLVED','CLOSED')),
	CONSTRAINT "contact_inquiries_delivery_check" CHECK ("contact_inquiries"."email_delivery_status" in ('PENDING','SENT','FAILED','NOT_CONFIGURED'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_accepted_version" varchar(20);--> statement-breakpoint
ALTER TABLE "contact_inquiries" ADD CONSTRAINT "contact_inquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_inquiries_email_created_idx" ON "contact_inquiries" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "contact_inquiries_ip_created_idx" ON "contact_inquiries" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "contact_inquiries_status_created_idx" ON "contact_inquiries" USING btree ("status","created_at");