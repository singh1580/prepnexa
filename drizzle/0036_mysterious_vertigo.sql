CREATE TABLE "product_slug_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"old_slug" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" varchar(280);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primary_subject" varchar(160);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "search_keywords" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "highlights" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "faqs" jsonb;--> statement-breakpoint
ALTER TABLE "product_slug_redirects" ADD CONSTRAINT "product_slug_redirects_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_redirects_old_slug_uq" ON "product_slug_redirects" USING btree ("old_slug");--> statement-breakpoint
CREATE INDEX "product_slug_redirects_product_idx" ON "product_slug_redirects" USING btree ("product_id");