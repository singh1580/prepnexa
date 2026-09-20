# Phase 5 — Admin content management

Phase 5 implements permission-checked content operations without starting test execution, results, commerce, or protected-material delivery.

## Delivery slices

1. Admin content foundation and exam taxonomy: exams, subjects, topics, responsive UI, audit trail.
2. Test-centred authoring: write/import questions inside a paper; the question bank is optional reuse tooling.
3. Single-admin publishing: draft, preview, publish and archive with server permission checks.
4. Prepared-test builder: sections, direct question creation/import/edit, optional bank reuse and paper publication; execution remains Phase 6.
5. Package/material metadata and question bulk import with atomic validation.

## Authorization

- Navigation is derived from the authenticated user's permissions.
- Every page and mutation independently enforces its required permission on the server.
- The Admin account can create and publish directly. No second staff member or reviewer is required.
- Legacy role keys stay in the database for compatibility; they do not create extra dashboards or approval steps.
- Every successful content mutation creates an `audit_logs` record with the actor, request ID and before/after state.

## Data and branch policy

- Git branch: `feature/phase-5-admin-content` from `develop`.
- Neon branch: `phase-5-content` from `phase-3-auth`.
- Existing Phase 2 content, versioning, import, scheduling and audit tables remain authoritative.
- Production and `main` remain untouched until the complete release process.

## Current slice acceptance

- Only users with `exam.manage` can open or mutate exam taxonomy.
- Exams begin as private drafts.
- Exams publish only after a subject/topic exists; published taxonomy remains editable without replacing identifiers and dependency-aware archiving prevents broken catalog links.
- Exam, subject and topic names/order can be maintained without physical deletion.
- Duplicate slugs/names return a stable conflict response.
- Mutations and their audit entries execute in the same database batch.
- Mobile and keyboard-accessible forms pass lint, type and UI review.
- Choice, numeric and text questions create immutable revisions and remain private as drafts.
- Draft questions can be edited and directly published. Existing IN_REVIEW questions can also be directly published.
- Creators can publish their own questions. Legacy submit/review endpoints return 410 with guidance to publish directly.
- Question state changes and revision writes are audited in the same database batch.
- Draft tests support sections, direct draft questions, optional published-question reuse, timing, shuffle and attempt limits. Editing inside a paper attaches a private copy without altering other papers.
- Current admin creation and publishing accepts mock tests only. Legacy live schedule data remains compatible but its controls are outside current acceptance.
- A test cannot publish without sections and a question in every section. Paper publication also publishes its draft questions and latest answer revisions; no separate question approval is needed.
- A standalone product selects one published resource; a bundle selects multiple published tests/materials. Each has its own price and validity. Checkout/payment remains Phase 8.
- Material version 1 and its audit record are created atomically; protected delivery is intentionally deferred.
- CSV imports validate every row and every topic first, then import all draft questions in one database batch or none.

## Remaining acceptance work

See PROJECT_STATUS.md. Phase 5 is not fully accepted merely because lint/build pass. Draft editing, published-content copies and maintenance controls are now implemented. Live database/browser acceptance is tracked in PROJECT_STATUS.md. File upload and delivery are not complete.


## Mock-first scope update
Live tests and standalone practice-mode creation are deferred by the owner. Existing database modes/schedules remain for compatibility. Current test creation is MOCK only; free diagnostic and paid mock packages remain. Students start a prepared test on demand and its timer begins at attempt creation (Phase 6). Live scheduling is not part of current acceptance.

This update hides schedule controls, rejects non-mock creation/publication, fixes async form reset, adds draft question/empty-section removal and prevents publishing papers with empty sections. Actual student attempts, autosave/resume and results remain pending.
