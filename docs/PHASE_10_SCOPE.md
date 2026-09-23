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

Migration `0012_single_admin_roles.sql` safely converts the existing `CONTENT_ADMIN` owner assignment to `ADMIN`, removes the unused reviewer/support/finance/super-admin role records, and rejects ambiguous databases that contain multiple administrator or assigned legacy-staff accounts. A database trigger prevents a second Admin assignment. The RBAC seed then maintains only `STUDENT` and `ADMIN`; the Admin receives every capability used by the single Admin workspace.

## Delivery and failure behavior

In-app notification creation is idempotent through `deduplication_key`. Each notification has at most one email delivery row. Email is attempted after the primary payment/result/support operation commits; a missing provider or failed send records a retryable failure and never rolls back payment, entitlement, result or support state.

Migration `0011_lowly_lady_vermin.sql` adds the nullable notification deduplication key and two unique indexes. Migration `0012_single_admin_roles.sql` consolidates the role model without hard-coding an owner email or user ID. Both must be verified on the isolated Neon branch before merge; production and the shared development branch remain unchanged.

## Verification checkpoint

- TypeScript and ESLint pass.
- Unit suite passes with Phase 10 validation and permission cases.
- Migration column and indexes verified on the isolated Neon branch.
- Consolidated browser/mobile/accessibility acceptance remains deferred to Phase 11 as approved by the owner.
- Production Resend, payment and storage credentials remain deployment configuration; secrets are not committed.
- No editable Settings page is invented in this phase. Provider selection and secret configuration stay in the deployment checklist, matching the earlier phases.
