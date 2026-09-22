# Phase 8 — provider-neutral commerce

Phase 8 adds checkout and access without tying PrepNexa to Razorpay, Stripe or another gateway. The production provider is intentionally undecided. Core business rules live behind a `PaymentProvider` interface; the bundled mock adapter is for local and automated testing and refuses to run in production.

## Student flow

1. A signed-in Student opens a published package and may preview an eligible coupon.
2. The server reloads the product price, currency, access period and coupon rules; browser totals are never trusted.
3. Checkout creates one idempotent order, immutable order item and an expiring coupon reservation.
4. A paid order creates a provider attempt. Only a verified provider event with the exact internal amount and currency can capture it.
5. Capture records the payment, consumes the coupon and grants the entitlement in one database statement.
6. A zero-total order completes without contacting a provider and grants access through the same order/entitlement model.
7. Students can review their order history from the Student dashboard.

## Admin flow

The existing single Admin workspace now contains:

- coupon create, edit, enable and disable controls;
- fixed and percentage offers, minimum order, percentage cap, schedule, total/per-student limits and optional product targeting;
- order/payment status and captured/refunded totals;
- idempotent partial or full refunds with an explicit access-revocation choice.

There is no reviewer or separate commerce dashboard.

## Safety guarantees

- Order, checkout and refund idempotency keys are server-scoped.
- Coupon capacity is reserved under a row lock; expired reservations are released.
- Provider event IDs and provider payment IDs are unique.
- Duplicate capture events resolve to the existing payment and do not grant duplicate access.
- Entitlements are unique per order/product.
- Refund totals cannot exceed the captured amount.
- Provider redirects never grant access.
- Mock confirmation is authenticated, Student-owned and disabled in production.
- Logs and API responses do not expose provider secrets or raw signatures.

## Migration

Migration `0008_damp_patriot.sql` adds currency/refund policy, immutable access duration on order items, order lifecycle timestamps, payment/refund metadata, coupon lifecycle constraints and explicit reservation states. Existing rows are backfilled before new required columns become non-null.

The migration was applied and inspected on the isolated Neon branch `phase-8-commerce`; production was not changed.

## Provider switch

To add a production gateway:

1. implement `PaymentProvider` inside `src/features/commerce/providers`;
2. verify the gateway's webhook signature in that adapter;
3. translate its events to the internal captured/failed event contract;
4. register the adapter and add conditionally validated server-only credentials;
5. run the same checkout, duplicate-webhook and refund contract tests.

Existing transactions retain their stored provider, so refunds continue through the original adapter after a default-provider change.

## Deferred

- Selecting and integrating the real production gateway.
- Provider-hosted invoices and scheduled reconciliation jobs.
- Production payment acceptance and final browser/visual acceptance.
- Protected PDF/material delivery, which is Phase 9.
