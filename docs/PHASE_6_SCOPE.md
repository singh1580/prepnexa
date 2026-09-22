# Phase 6 — student mock-test execution

Phase 6 delivers the authenticated, on-demand test runner for the approved mock-first product. Live scheduling remains deferred. Exactly two workspaces remain: Student and Admin.

## Delivered

- Student My tests library shows published papers unlocked by a free published product or an active entitlement.
- Test instructions show duration, sections, questions, attempt availability and access state before starting.
- Starting is server-authoritative and atomic. It creates immutable section, question, option and marking snapshots from the latest published revisions.
- Only one `CREATED` or `IN_PROGRESS` attempt may exist per student. Reopening the same paper resumes it; starting another paper reports a conflict.
- The runner supports single choice, multiple choice, numeric and text answers; question navigation; review marking; answer clearing; palette status and responsive layouts.
- The deadline is calculated on the server. The client timer is display/interaction assistance only; late writes are rejected and overdue attempts are auto-submitted when accessed.
- Every answer write uses an optimistic version. A delayed/stale browser write cannot overwrite a newer saved answer.
- Submission is idempotent, closes further answer writes and preserves the immutable attempt record for Phase 7 scoring.
- API responses never expose correct-option flags, answer configuration or explanations during an active attempt.
- Login can safely return a student to an internal test route after authentication/MFA.

## Database migration

Migration `0007_gray_karen_page` adds:

- snapshot topic and question type, backfilled before becoming required;
- answer versioning with a positive-version constraint;
- active-attempt and user-history indexes;
- a partial unique constraint that enforces one active attempt per user.

Before creating the unique index, historical duplicate active attempts are closed as auto-submitted while retaining the newest active record. The migration was exercised only on the isolated Phase 6 QA branch; production is untouched.

## Verification boundary

Unit coverage includes answer-shape validation. The isolated Neon QA integration passed free access, atomic start, safe snapshots, resume, one-active-attempt protection, versioned autosave, stale/foreign-option rejection, submission locking and max-attempt enforcement. Its synthetic fixtures were removed. Lint, TypeScript, 55 unit tests and the 42-page production build passed.

Browser visual acceptance is intentionally deferred by the owner until all planned product phases are implemented. No final visual acceptance is claimed in this phase.

## Deferred

- scoring, negative marking calculation, result release, explanations, breakdowns, rank and percentile (Phase 7);
- live/scheduled tests and coding execution;
- paid checkout/coupons/provider webhooks (Phase 8);
- protected material delivery and the combined student library (Phase 9).
