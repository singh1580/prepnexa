# PrepNexa implementation audit — 2026-09-19

Evidence: inspected requirements, delivery plan, source routes/services/schema and PR #4. User supplied successful local auth/MFA/admin/taxonomy logs. This is a source audit, not a fresh end-to-end test of every module or a production database audit.

## Agreed product
Exactly two dashboards: Student and Admin. One admin creates and publishes without staff approval. Existing public catalogue remains. Coupons, commerce, materials, results and support remain in scope. No new specialist dashboards. Current CONTENT_ADMIN grants cover existing content modules; explicit owner permission provisioning remains before operational modules launch.

## Historical inventory — see the current checkpoint below
| Area | Evidence/status | Remaining |
| --- | --- | --- |
| Architecture/CI | Modular source, validation/service/repository, migrations, GitHub CI exist | Release/security/load and restore verification |
| Database | Schema/migrations for content, RBAC, commerce, coupons, attempts, results, operations | Schema alone is not implementation; migration/constraint and live integration acceptance |
| Signup, verification, login, logout, profile | Implemented; user logs confirm successful core flows | Password-reset completion, device/session listing/revocation and two-device limit acceptance |
| Admin MFA | Enroll/confirm/login implemented; user confirmed success after SQL fix | Regression and broader security acceptance |
| Public catalogue | Landing, exam/package details and free-test discovery exist; user visited successfully | Published dataset acceptance; test start/checkout not yet delivered |
| Two workspace shells | Student/Admin routes exist, no specialist dashboard routes | Student purchased-content/results experience and admin operational metrics |
| Exams/subjects/topics | Create/edit/publish/archive code; user creation confirmed | Published taxonomy names/order and additions are now editable; IDs and links are preserved |
| Question bank | Four types, validation, revisions, preview/import and publication | Direct publication and editable draft copies implemented; original published question stays unchanged |
| Test builder/schedules | Create, section/question assignment, publish and live schedule code | Section edit, question removal/reordering, duplicate/archive controls implemented; integration/browser acceptance required |
| Packages | Create, bundle links, price/validity, publish code | Draft editing/unlinking, editable package copies and archive implemented; acceptance required |
| Materials | Article/file metadata, version 1 and direct publish | Draft edit, HTTPS video validation, copy and guarded archive implemented. Actual PDF/file upload, reader/download and access protection remain Phase 9 |
| CSV | Parsing, row errors and atomic draft import code; invalid job observed | CSV file picker implemented; valid import/rollback live acceptance required |
| Student test engine — Phase 6 | Tables/design only | Timer, attempts, snapshots, autosave, resume, submission, device/concurrency rules |
| Results — Phase 7 | Schema/design only | Scoring, release, explanations, breakdowns, rank/percentile, corrections |
| Coupons — Phase 8 | Coupon/product/redemption schema and permission only | Admin controls, validation, limits, checkout, concurrent redemption |
| Orders/payments — Phase 8 | Schema/provider-neutral design only | Checkout, adapter, mock integration, verified webhooks, access, refunds, invoices, reconciliation |
| Protected materials — Phase 9 | Schema/policy only | Private storage, authorized signed access, expiry/revocation, watermarking/access logs |
| Notifications/support — Phase 10 | Auth email works; operational tables exist | Purchase/test/result emails, retry delivery, in-app notifications, tickets/replies |
| Student/admin operations — Phase 10 | Basic account/content views | Student management, orders/refunds/coupons/support/settings in same dashboard |
| Release — Phase 11 | Not accepted | E2E, accessibility, security, performance, monitoring, backup/restore and beta sign-off |

## Changes in this update
- Remove mandatory reviewer approval from question publishing; allow the creator to publish.
- Preserve legacy IN_REVIEW content and allow it to publish without a data migration.
- Retire submit/review API actions with explicit 410 guidance.
- Replace reviewer-dependent UI with publish/archive actions.
- Fix archiving's empty revision update (Drizzle cannot update with an empty SET).
- Complete draft package/material editing, bundle unlink, content copies and dependency-aware archives.
- Complete section edits, question order/removal, test copies and test archives.
- Fix taxonomy async form reset and redact raw database errors.
- Published content changes use explicit draft copies so existing tests/packages keep their original linked records.
- Update requirements and phase plan; retain coupons and every original product module.

## Remaining order
1. Finish Phase 5 usability/maintenance gaps and run live content acceptance with one admin.
2. Test engine, then results.
3. Commerce including coupons with a replaceable payment provider.
4. Actual protected material upload/delivery and student library.
5. Complete operational screens/notifications/support in the same dashboards.
6. Release readiness.

Do not claim Phase 5 complete or merge draft PR #4 until acceptance. Existing published revisions and future attempt snapshots must be preserved when edit workflows are implemented.


## Mock-first scope update
Live tests and standalone practice-mode creation are deferred by the owner. Existing database modes/schedules remain for compatibility. Current test creation is MOCK only; free diagnostic and paid mock packages remain. Students start a prepared test on demand and its timer begins at attempt creation (Phase 6). Live scheduling is not part of current acceptance.

This update hides schedule controls, rejects non-mock creation/publication, fixes async form reset, adds draft question/empty-section removal and prevents publishing papers with empty sections. Actual student attempts, autosave/resume and results remain pending.


## Consolidated maintenance acceptance
The current batch targets Phase 5 content maintenance, not the remaining entire product. Live tests remain deferred. Phase 6 student attempts/timer/autosave/submission, Phase 7 results, Phase 8 coupons/payments, Phase 9 actual storage upload/protected delivery and Phase 10 operations remain separate.

QA uses the isolated Neon branch `phase-5-acceptance`. The complete auth/MFA database flow passed. The admin database flow successfully exercised taxonomy creation and published editing, CSV import, direct question publication, mock-test remove/reorder/publish, material version editing, and package edit/link/unlink/publish. The runner then hit its 20-minute limit while executing final dependency assertions, so the full admin suite is not recorded as passed; those guards also have passing unit coverage. The integration timeout is configurable because this runner's Neon requests take roughly 20–50 seconds each. Browser acceptance should cover create/edit/copy/publish/archive and failed dependency checks.


## Approved test-centred simplification
See [ADMIN_SIMPLIFICATION.md](ADMIN_SIMPLIFICATION.md) for the approved scope, delivered test/import/product-assembly changes, verification evidence and remaining student/material/commerce work. This supersedes the earlier question-bank-first authoring flow; prepared topic and subject practice sets remain in scope, while live scheduling stays deferred. Phase 5 browser acceptance is still pending.


## Current checkpoint: consolidated scope and Admin usability

The current implementation is documented in ADMIN_SIMPLIFICATION.md; the historical inventory above is not a second competing plan. Product requirements and Phase 5 acceptance now match paper-level publication, prepared topic/subject practice sets and standalone/bundle assembly. Live reminders follow deferred live scheduling.

This batch adds test-name/exam/status filters and a contextual Edit in this test screen. Saving creates an isolated question/answer copy and replaces that paper's assignment atomically, keeping its position and preserving the original for other papers. Missing/stale assignments, wrong-exam topics and non-draft papers reject edits.

Saved full-mock/subject/topic categories and atomic same-section repeat-CSV protection are now implemented with migration 0006. Existing papers remain Uncategorised; publish enforces single-subject/topic content for the corresponding type. Remaining Admin work: richer subject/topic and bundle-content search, and combined browser acceptance. Then deliver student test execution/results, real protected materials/library, commerce/coupons, operations and release checks. No separate staff dashboards are introduced.
