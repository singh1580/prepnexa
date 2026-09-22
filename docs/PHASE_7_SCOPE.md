# Phase 7 — scoring and student results

Phase 7 evaluates submitted on-demand mock attempts from their immutable Phase 6 snapshots and publishes an immediate Student result. Live scheduling remains deferred.

## Scoring rules

- Marks and negative marks come from the attempt snapshot, never from subsequently edited questions.
- Single and multiple choice require the exact set of correct snapshotted options. There is no partial credit.
- Numeric answers use the snapshotted accepted value and tolerance.
- Text answers trim surrounding whitespace and follow the snapshotted case-sensitivity rule.
- Unanswered questions receive zero; an attempted incorrect answer receives the configured negative mark.
- Decimal calculations use integer hundredths before persistence to avoid floating-point score drift.

## Publication and review

- Manual and automatic submissions are evaluated idempotently. A retry returns the existing version-1 result instead of duplicating it.
- Initial mock results publish immediately and include total/max score, correct/incorrect/unanswered counts, accuracy and time spent.
- Section and topic aggregates are stored with the result.
- Answer review exposes the student's response, correct snapshotted options/answer and the snapshotted explanation only after publication.
- Result list/detail queries are always scoped to the authenticated Student owner.
- Previously submitted but unevaluated attempts are repaired lazily when the Student opens Results.

## Deferred boundary

- Rank and percentile require an explicitly enabled cohort. Current on-demand mocks have no ranking cohort; live schedules and published rank snapshots remain deferred with live testing.
- Manual result corrections/revisions and operational Admin controls remain a later Admin operations slice.
- Consolidated browser/visual acceptance remains deferred by the owner until all planned product phases are complete.

## Verification

- Pure scoring tests cover correct, incorrect, unanswered, exact multiple choice, numeric tolerance, text case policy and aggregate decimal totals.
- The isolated Neon integration passed submit → published result → score/explanation review, retry/lock rules and max-attempt enforcement.
- Synthetic users and results were removed and verified at zero after the run.
- Lint, TypeScript, 59 unit tests and the 43-page production build pass.
