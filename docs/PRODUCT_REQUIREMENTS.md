# PrepNexa MVP Product Requirements

Status: Revised for the approved single-admin workflow

PrepNexa is a mobile-first placement-exam preparation platform for India. The first catalogue targets TCS-style placement preparation, while the data model and navigation must allow additional company exams without code duplication. PrepNexa is an independent preparation service and must not imply affiliation with an employer or examination body.

## 1. Users and roles

The product has exactly two workspaces: Student and Admin. One owner can operate every admin module without another staff member's approval.

- Student: browse, purchase, take tests, use materials, view results and contact support.
- Admin: manage content, students, coupons, orders, payments, support and settings within one dashboard.
- Existing database role keys remain for compatibility; they do not imply separate dashboards or required staff. The current CONTENT_ADMIN account can operate existing content tools. Owner-wide permissions must be provisioned explicitly before commerce/support management launches; never auto-promote reviewer/support accounts.
- Server permissions and administrator MFA remain enforced.

## 2. MVP catalogue

The first release supports:

- One free diagnostic test.
- Paid packages containing tests, study materials, or both.
- Topic-wise practice tests.
- Full mock tests.
- Scheduled live tests: deferred; not part of the current mock-first release.
- Articles, private PDFs, videos, and downloadable resources.

Every product stores its own price, currency, access duration, included resources, publication status, and refund-policy reference. The default access duration is 90 days, but it is configurable per product.

## 3. Authentication and accounts

- A verified account is required to start any test, purchase a product, or access protected material.
- Email is the primary login identifier in the MVP; verified phone support may be added later.
- Students can view and revoke active sessions.
- Default limit: two active devices and one active test session per account.
- Suspended, deleted, or unverified users cannot begin a purchase or a test attempt.
- Admin accounts require two-factor authentication before production launch.

## 4. Test modes

### Practice (standalone mode deferred; topic-focused mock papers remain possible)

- Attempts are configurable; the default is unlimited.
- Results and explanations are released immediately unless explicitly delayed.
- Ranking is normally disabled.

### Mock

- Attempt limit is configurable; the default is one.
- The timer starts when the attempt starts.
- Results are immediate unless the test has a configured release time.
- Ranking may be enabled for a defined cohort.

### Live (deferred)

- The test has an authoritative server start and end time.
- Default late-join window is 15 minutes and is configurable per schedule.
- Joining late never extends the scheduled end time.
- The default attempt limit is one.
- Results are released at the configured result-release time.
- Rank uses the first valid evaluated attempt unless an administrator formally voids it.

## 5. Test execution rules

- The server, not the browser clock, determines start, deadline, and submission validity.
- Starting an attempt creates immutable question and option snapshots.
- Question and option order may be randomized and must remain stable for that attempt.
- Answers auto-save idempotently. Repeating the same request cannot create duplicates.
- A refresh, reconnect, or second tab resumes the same active attempt.
- The server rejects answers received after the authoritative deadline.
- Deadline submission is automatic and idempotent.
- Scoring uses the snapshotted marks and negative marks, not subsequently edited question data.
- Manual result corrections require a reason and an audit record.

## 6. Results and analytics

Students may see, according to the test release policy:

- Total and maximum score.
- Correct, incorrect, and unanswered counts.
- Accuracy and time spent.
- Section-wise and topic-wise performance.
- Rank and percentile when ranking is enabled.
- Correct answers and explanations when disclosure is enabled.

Rank calculations include only eligible, evaluated, non-void attempts in the configured cohort. Published rank snapshots are versioned so a recalculation remains auditable.

## 7. Orders, payments, and access

- The application calculates the payable amount from server-side product data.
- Orders, payment attempts, refunds, and access entitlements are separate records.
- Access is granted only after a provider-verified successful payment state.
- Frontend success callbacks never grant access by themselves.
- Webhook processing is signature-verified and idempotent.
- A duplicate callback or webhook cannot create duplicate payment or entitlement records.
- Full and partial refunds are supported independently of the selected provider.
- Whether a refund revokes access is determined by the recorded refund policy and refund decision.
- Failed, cancelled, expired, or pending payments do not grant access.

Payment providers are replaceable adapters. No order, entitlement, UI, or result code may depend directly on Razorpay, Cashfree, PhonePe, or another provider.

### Coupons (Phase 8)

Keep fixed/percentage discounts, start/end dates, minimum order, maximum discount, total/per-student usage limits, eligible packages and enable/disable controls. Existing coupon tables are only a schema foundation: admin screens, checkout validation and race-safe redemption remain to implement. All controls live in the common Admin dashboard.

## 8. Protected materials

- Paid files are never placed in the public application directory.
- Every access request validates an active entitlement.
- Private files use short-lived signed access; the default expiry is five minutes.
- PDF watermarking may include the student's name, masked email, and access timestamp.
- Material views and downloads are auditable.
- A revoked or expired entitlement blocks new links immediately.
- The product will not claim that screenshots or screen recording can be completely prevented.

## 9. Admin content workflow

Questions and materials use draft, preview, direct publish and archive. No separate reviewer is required. Legacy IN_REVIEW questions can be directly published by an authorized admin.

- The same admin can create and publish their own content.
- Publishing records the actor and timestamp.
- Editing published content creates a revision instead of silently changing history.
- Active or completed test attempts retain their original snapshots.
- Bulk imports produce row-level validation errors and never partially publish invalid content.

## 10. Notifications and support

The MVP supports in-app and email notifications for verification, password reset, purchase confirmation, payment failure, live-test reminders, result publication, suspicious login, and support-ticket updates.

Notification failure does not roll back a successful payment or test submission. Failed deliveries are recorded for retry.

## 11. Non-functional requirements

- Mobile-first and keyboard-accessible test interface.
- Structured logs with request IDs and secret redaction.
- No credentials, raw session tokens, correct answers, or unnecessary personal data in logs.
- Money stored as integer minor units (paise for INR).
- All timestamps stored with timezone and evaluated server-side.
- Database migrations tested on a Neon development branch before production.
- Critical mutations are transactional and idempotent.
- Public pages should remain usable on slow mobile networks.

## 12. Explicitly outside the first release

- Native Android or iOS applications.
- AI video proctoring.
- Live video classes.
- Teacher marketplace.
- Student community or chat.
- Multi-vendor payments.
- Complex recurring subscriptions.
- Under-18 registrations.

## Phase 0 acceptance criteria

- Every MVP feature maps to an owner role and an access rule.
- Test start, deadline, scoring, result-release, and rank rules are unambiguous.
- Payment success and access creation are provider-independent.
- Product access and protected-material rules are defined.
- Deferred features cannot silently expand the MVP.
