# Phase 10 — dashboards, notifications and support

Phase 10 completes operational workflows inside the existing Student and Admin workspaces. It does not introduce staff roles or dashboards, change `main`, or select a production payment/storage provider.

## Student operations

- Dashboard summaries for available tests, library items, results, orders, unread notifications and open tickets.
- Active-device list with ownership-scoped revocation. New logins retain at most `MAX_ACTIVE_SESSIONS` active sessions; the default is two.
- In-app notification inbox with individual and bulk read controls.
- Notifications for purchase confirmation, payment failure, result publication, suspicious login and support updates.
- Support ticket creation, optional owned-order linking, ticket history and student replies.

## Admin operations

- Operational dashboard summaries for students, open tickets, notification delivery and paid orders.
- Permission-gated student list. Account suspension/reactivation requires `system.manage`, rejects administrator accounts and revokes active sessions when a student is suspended.
- Permission-gated support queue, priority/status control and replies.
- Notification-delivery status and manual email retry through the existing Resend configuration.
- Recent audit activity for administrators with `audit.read`.

## Permission boundary

The product has exactly two role keys: `STUDENT` and `ADMIN`. There is one Admin account and one Admin workspace. Operational pages independently enforce server permissions as defence in depth:

- `user.read.support`: read student operations.
- `system.manage`: suspend/reactivate students.
- `support.manage.all`: manage all support tickets.
- `notification.manage`: inspect and retry notification email.
- `audit.read`: inspect activity.

Migration `0012_single_admin_roles.sql` safely converts the existing `CONTENT_ADMIN` owner assignment to `ADMIN`, preserves assignment timestamps using the physical `created_at` column, removes the unused reviewer/support/finance/super-admin role records, and rejects ambiguous databases that contain multiple administrator or assigned legacy-staff accounts. A database trigger provides the second-Admin error, and a partial unique index enforces the limit across concurrent transactions. The index resolves the Admin role ID during migration; no account ID is hard-coded. The RBAC seed then maintains only `STUDENT` and `ADMIN`; the Admin receives every capability used by the single Admin workspace.

## Delivery and failure behavior

In-app notification creation is idempotent through `deduplication_key`. Each notification has at most one email delivery row. Email is attempted after the primary payment/result/support operation commits; a missing provider or failed send records a retryable failure and never rolls back payment, entitlement, result or support state.

Migration `0011_lowly_lady_vermin.sql` adds the nullable notification deduplication key and two unique indexes. Migration `0012_single_admin_roles.sql` consolidates the role model without hard-coding an owner email or user ID. Both must be verified on the isolated Neon branch before merge; production and the shared development branch remain unchanged.

## Verification checkpoint

- TypeScript and ESLint pass.
- Unit suite passes with Phase 10 validation and permission cases.
- Migration column and indexes verified on the isolated Neon branch.
- On 2026-09-23, migration `0012` was applied atomically on `phase-10-operations` (`br-purple-voice-b396eu4l`) in project `odd-breeze-04065253`, database `prepnexa`. Assertions confirmed that only `STUDENT` and `ADMIN` remain, the existing owner's assignment and all three Student assignments retain their timestamps and assigners, all 21 Admin grants are preserved, a second Admin is rejected, and the concurrency-safe unique index is valid.
- The QA branch already contained the exact `0011` column/index definitions but lacked its Drizzle history entry. The definitions were verified before recording the migration's repository hash and timestamp in the same transaction as `0012`. No shared-development or production migration was applied.
- Consolidated browser/mobile/accessibility acceptance remains deferred to Phase 11 as approved by the owner.
- Production Resend, payment and storage credentials remain deployment configuration; secrets are not committed.
- No editable Settings page is invented in this phase. Provider selection and secret configuration stay in the deployment checklist, matching the earlier phases.
