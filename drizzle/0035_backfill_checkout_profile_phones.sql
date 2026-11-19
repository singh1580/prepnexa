-- Older checkout flows stored the customer's verified mobile number on the
-- paid order only. Seed an empty profile from that user's latest successful
-- paid order so future checkouts can reuse it. Never overwrite profile data.
WITH latest_paid_phone AS (
  SELECT DISTINCT ON ("user_id")
    "user_id",
    "billing_phone"
  FROM "orders"
  WHERE "status" = 'PAID'
    AND "billing_phone" ~ '^\+91[6-9][0-9]{9}$'
  ORDER BY "user_id", "paid_at" DESC NULLS LAST, "created_at" DESC
)
UPDATE "users" AS u
SET "phone" = latest_paid_phone."billing_phone",
    "updated_at" = now()
FROM latest_paid_phone
WHERE u."id" = latest_paid_phone."user_id"
  AND nullif(trim(u."phone"), '') IS NULL;
