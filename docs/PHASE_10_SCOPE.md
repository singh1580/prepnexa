# Phase 10 — dashboards, notifications and support

Phase 10 completes operational workflows inside the existing Student and Admin workspaces. It does not introduce staff dashboards, change `main`, select a production payment/storage provider, or assign owner-wide permissions to an existing account.

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

Existing role keys remain for compatibility, but they do not create separate dashboards. Operational pages independently enforce their server permission:

- `user.read.support`: read student operations.
- `system.manage`: suspend/reactivate students.
- `support.manage.all`: manage all support tickets.
- `notification.manage`: inspect and retry notification email.
- `audit.read`: inspect activity.

The existing owner continues to use `CONTENT_ADMIN`, matching the earlier phases. Its seed grants are explicitly extended to the operational, finance, audit and system permissions used by the single Admin workspace; `role.manage` remains reserved. Reviewer and support roles are not promoted. The seed must be run in the target environment before operational launch; no production role is changed by the schema migration itself.

## Delivery and failure behavior

In-app notification creation is idempotent through `deduplication_key`. Each notification has at most one email delivery row. Email is attempted after the primary payment/result/support operation commits; a missing provider or failed send records a retryable failure and never rolls back payment, entitlement, result or support state.

Migration `0011_lowly_lady_vermin.sql` adds the nullable notification deduplication key and two unique indexes. It was applied and inspected on isolated Neon branch `phase-10-operations`; production and the shared development branch were not changed.

## Verification checkpoint

- TypeScript and ESLint pass.
- Unit suite passes with Phase 10 validation and permission cases.
- Migration column and indexes verified on the isolated Neon branch.
- Consolidated browser/mobile/accessibility acceptance remains deferred to Phase 11 as approved by the owner.
- Production Resend, payment and storage credentials remain deployment configuration; secrets are not committed.
- No editable Settings page is invented in this phase. Provider selection and secret configuration stay in the deployment checklist, matching the earlier phases.
