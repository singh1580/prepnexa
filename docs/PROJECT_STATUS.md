# PrepNexa implementation audit — 2026-09-19

Evidence: inspected requirements, delivery plan, source routes/services/schema and PR #4. User supplied successful local auth/MFA/admin/taxonomy logs. This is a source audit, not a fresh end-to-end test of every module or a production database audit.

## Agreed product
Exactly two dashboards: Student and Admin. One admin creates and publishes without staff approval. Existing public catalogue remains. Coupons, commerce, materials, results and support remain in scope. No new specialist dashboards. Current CONTENT_ADMIN grants cover existing content modules; explicit owner permission provisioning remains before operational modules launch.

## Inventory
| Area | Evidence/status | Remaining |
| --- | --- | --- |
| Architecture/CI | Modular source, validation/service/repository, migrations, GitHub CI exist | Release/security/load and restore verification |
| Database | Schema/migrations for content, RBAC, commerce, coupons, attempts, results, operations | Schema alone is not implementation; migration/constraint and live integration acceptance |
| Signup, verification, login, logout, profile | Implemented; user logs confirm successful core flows | Password-reset completion, device/session listing/revocation and two-device limit acceptance |
| Admin MFA | Enroll/confirm/login implemented; user confirmed success after SQL fix | Regression and broader security acceptance |
| Public catalogue | Landing, exam/package details and free-test discovery exist; user visited successfully | Published dataset acceptance; test start/checkout not yet delivered |
| Two workspace shells | Student/Admin routes exist, no specialist dashboard routes | Student purchased-content/results experience and admin operational metrics |
| Exams/subjects/topics | Create/edit/publish/archive code; user creation confirmed | Maintenance of published taxonomy is currently locked; simplify safely |
| Question bank | Four types, validation, revisions, preview/import and publication | Same-admin publication added in this update; live acceptance, published revision editing remain |
| Test builder/schedules | Create, section/question assignment, publish and live schedule code | Complete remove/reorder/edit/archive controls; full browser/DB acceptance |
| Packages | Create, bundle links, price/validity, publish code | Editing/unlinking/archive and complete acceptance |
| Materials | Article/file metadata, version 1 and direct publish | Actual PDF/file upload, video input UX, edit/archive, reader/download and access protection |
| CSV | Parsing, row errors and atomic draft import code; invalid job observed | Valid import and rollback acceptance against live DB; file picker UX |
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
