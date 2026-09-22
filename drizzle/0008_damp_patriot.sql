CREATE TYPE "public"."coupon_redemption_status" AS ENUM('RESERVED', 'CONSUMED', 'RELEASED');--> statement-breakpoint
DROP INDEX "coupon_redemptions_user_idx";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "access_days" integer;--> statement-breakpoint
UPDATE "order_items" oi SET "access_days" = p."access_days" FROM "products" p WHERE p."id" = oi."product_id";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "access_days" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar(60);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
UPDATE "orders" SET "expires_at" = "created_at" + interval '30 minutes';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "currency" varchar(3) DEFAULT 'INR' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "refund_policy" varchar(40) DEFAULT 'STANDARD_DIGITAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD COLUMN "status" "coupon_redemption_status" DEFAULT 'RESERVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
UPDATE "coupon_redemptions" cr SET "expires_at" = o."created_at" + interval '30 minutes',
  "status" = CASE WHEN o."status" IN ('PAID','REFUNDED','PARTIALLY_REFUNDED') THEN 'CONSUMED'::"coupon_redemption_status" ELSE 'RELEASED'::"coupon_redemption_status" END
FROM "orders" o WHERE o."id" = cr."order_id";--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD COLUMN "consumed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD COLUMN "released_at" timestamp with time zone;--> statement-breakpoint
UPDATE "coupon_redemptions" SET "consumed_at" = "created_at" WHERE "status" = 'CONSUMED';--> statement-breakpoint
UPDATE "coupon_redemptions" SET "released_at" = "created_at" WHERE "status" = 'RELEASED';--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD COLUMN "raw_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "idempotency_key" varchar(100);--> statement-breakpoint
UPDATE "refunds" SET "idempotency_key" = 'legacy:' || "id"::text;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "idempotency_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_product_uq" ON "order_items" USING btree ("order_id","product_id");--> statement-breakpoint
CREATE INDEX "orders_status_expiry_idx" ON "orders" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_expiry_idx" ON "coupon_redemptions" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_idempotency_uq" ON "refunds" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_user_idx" ON "coupon_redemptions" USING btree ("coupon_id","user_id","status");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_values_check" CHECK ("order_items"."unit_price_paise" >= 0 and "order_items"."access_days" > 0 and "order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_currency_check" CHECK ("orders"."currency" = upper("orders"."currency") and char_length("orders"."currency") = 3);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_currency_check" CHECK ("products"."currency" = upper("products"."currency") and char_length("products"."currency") = 3);--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_discount_check" CHECK ("coupon_redemptions"."discount_paise" > 0);--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_value_check" CHECK ("coupons"."value" > 0 and ("coupons"."type" <> 'PERCENT' or "coupons"."value" <= 10000) and "coupons"."min_order_paise" >= 0 and ("coupons"."max_discount_paise" is null or "coupons"."max_discount_paise" > 0) and ("coupons"."total_limit" is null or "coupons"."total_limit" > 0) and "coupons"."per_user_limit" > 0 and ("coupons"."ends_at" is null or "coupons"."starts_at" is null or "coupons"."ends_at" > "coupons"."starts_at"));--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_amount_check" CHECK ("payment_attempts"."amount_paise" > 0);--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_check" CHECK ("refunds"."amount_paise" > 0);
