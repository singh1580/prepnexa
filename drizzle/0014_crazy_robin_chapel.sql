ALTER TABLE "products" DROP CONSTRAINT "products_price_access_check";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "mrp_paise" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_access_check" CHECK ("products"."price_paise" >= 0 and ("products"."mrp_paise" is null or "products"."mrp_paise" >= "products"."price_paise") and "products"."access_days" > 0);
