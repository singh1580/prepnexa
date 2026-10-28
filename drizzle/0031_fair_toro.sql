CREATE TABLE "api_rate_limits" (
	"action" varchar(80) NOT NULL,
	"key_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "api_rate_limits_action_key_hash_window_start_pk" PRIMARY KEY("action","key_hash","window_start"),
	CONSTRAINT "api_rate_limits_count_check" CHECK ("api_rate_limits"."request_count" > 0)
);
--> statement-breakpoint
CREATE INDEX "api_rate_limits_expiry_idx" ON "api_rate_limits" USING btree ("expires_at");