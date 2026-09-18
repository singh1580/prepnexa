# Phase 5 — Admin content management

Phase 5 implements permission-checked content operations without starting test execution, results, commerce, or protected-material delivery.

## Delivery slices

1. Admin content foundation and exam taxonomy: exams, subjects, topics, responsive UI, audit trail.
2. Question bank and immutable revisions: authoring, options, marks, explanations, preview.
3. Review workflow: draft, in-review, publish, archive, reviewer separation and permission tests.
4. Test builder and live schedules: sections, question assignment and configuration only; execution remains Phase 6.
5. Package/material metadata and question bulk import with atomic validation.

## Authorization

- Navigation is derived from the authenticated user's permissions.
- Every page and mutation independently enforces its required permission on the server.
- `CONTENT_REVIEWER` cannot create or publish questions.
- A content author cannot approve their own revision when separation of duties applies.
- Every successful content mutation creates an `audit_logs` record with the actor, request ID and before/after state.

## Data and branch policy

- Git branch: `feature/phase-5-admin-content` from `develop`.
- Neon branch: `phase-5-content` from `phase-3-auth`.
- Existing Phase 2 content, versioning, import, scheduling and audit tables remain authoritative.
- Production and `main` remain untouched until the complete release process.

## Current slice acceptance

- Only users with `exam.manage` can open or mutate exam taxonomy.
- Exams begin as private drafts.
- Exam, subject and topic names/order can be maintained without physical deletion.
- Duplicate slugs/names return a stable conflict response.
- Mutations and their audit entries execute in the same database batch.
- Mobile and keyboard-accessible forms pass lint, type and UI review.
- Choice, numeric and text questions create immutable revisions and remain private as drafts.
- Draft questions can be edited, submitted, returned, separately approved and published.
- Creators cannot approve their own questions; publishing requires an approved current revision.
- Question state changes and revision writes are audited in the same database batch.
- Draft tests support sections, published-question assignment, timing, shuffle and attempt limits.
- Only live-mode tests accept validated schedules; test execution and attempt creation remain outside Phase 5.
- A test cannot publish until it contains at least one section with a published question.
