# Database Design

The Phase 2 schema contains 60 tables divided into six modules:

- `core.ts`: users, sessions, catalogue, current question state, tests, attempts, orders, payments, entitlements, notifications, and audit logs.
- `rbac.ts`: roles, permissions, assignments, MFA factors, and recovery codes.
- `content.ts`: immutable question/material versions and bulk-import tracking.
- `scheduling.ts`: live schedules, attempt snapshots, section state, versioned results, and rank snapshots.
- `commerce.ts`: provider-neutral payment attempts, refunds, coupons, invoices, and reconciliation.
- `operations.ts`: material access, security events, support, notification delivery, and background jobs.

## Integrity principles

- Orders, provider payment attempts, settled payments, refunds, and entitlements are separate.
- Provider identifiers are namespaced by provider; internal IDs remain canonical.
- Questions and materials are versioned; active attempts use immutable snapshots.
- Results and rank calculations are versioned instead of overwritten.
- RBAC is data-driven and seeded with least-privilege roles.
- Unique idempotency keys protect retryable commerce operations.
- Money uses integer minor units and critical amounts have database checks.
- Schedules, entitlement windows, durations, and counters receive database checks.

## Phase 2 migration review

The migration runs only on the isolated Neon `phase-2-schema` branch first. That branch currently has no application rows. It removes provisional duplicated fields after their final replacements exist:

- `users.role` in favor of `roles`, `permissions`, and mapping tables.
- Schedule timestamps on `tests` in favor of `test_schedules`.
- Score/rank fields on `attempts` in favor of versioned `results` and rank tables.
- `orders.gateway_order_id` in favor of provider-neutral payment attempts.
- `payments.signature_verified` in favor of verified normalized payment records.
- The obsolete `user_role` enum.

Production remains untouched until the isolated migration, seed, constraints, integration checks, and SQL review all pass.

`src/db/verification/phase-two.sql` is the repeatable isolated-branch smoke test for table count, RBAC seed, removed provisional columns, provider-neutral payment structure, and a real database constraint rejection.
