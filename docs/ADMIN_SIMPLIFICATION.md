# Approved Admin and Student delivery

The owner approved implementation after the research/planning review. There are two authenticated workspaces: Student and Admin. The public catalogue remains. One admin can prepare and publish content without another staff member's approval. Live tests remain deferred.

## Delivery 1: test creation and product assembly

Implemented in this branch:

- Exam workspace links to that exam's filtered test list and preselected create form. Test lists can be searched by name and filtered by exam/status.
- Edit in this test opens a contextual editor. Saving attaches a new question/answer copy at the same position so other papers retain the original. A stale edit rejects without saving orphan questions.
- A new prepared mock/practice set starts with one Questions section. Add more sections when needed.
- Manual questions are saved directly into a section. The separate question bank is optional reuse tooling.
- Test CSV uses a selected subject/topic; no spreadsheet topic UUID is required. All rows in an import use the selected topic, including legacy CSVs that carry a topicId column.
- The simple MCQ template has question, four options, correct answer and explanation. Default marking: 1 mark, no negative marking, medium difficulty. Advanced columns support existing multiple-choice, numeric and text types.
- Preview validates all rows before import. The server repeats validation. One invalid row prevents the entire import. Questions, answer revisions, options, test assignments and audit/job records are written in a single SQL statement.
- Wrong-exam topics, missing destinations and published-test imports are rejected. Imported questions stay draft until paper publication. Their order follows the CSV and can be changed inside the section.
- The paper shows answer/explanation previews. Publishing the test also publishes its draft questions/latest revisions atomically. Both test management and question publication permissions are required, within the same Admin workspace.
- Store creation allows checkbox selection of one published resource or multiple tests/materials, with an independent price and access period. Product plus selected links are created atomically. The same resource can be selected in multiple products without copying it. Empty draft products remain supported but cannot be published.
- Existing published content, orders and catalogue routes are preserved. No schema migration is required for this delivery.

This delivery does not implement payment or student entitlements. Creating a product is not proof that checkout or paid access works.

## Remaining stages

1. Finish authoring usability: browser acceptance, richer subject/topic filters and bulk content selection search. Current on-demand papers use existing MOCK mode; topic/subject scope comes from their chosen questions.
2. Student test engine: free entry, server-authoritative start/deadline, question snapshots, autosave, resume, submission, scoring and result review. Coding execution is a separate capability, not implemented by TEXT questions.
3. Materials: actual private upload, PDF/article/file organisation, previews and protected delivery. Existing PDF/file forms only hold metadata; they are not the final upload experience.
4. Commerce: standalone resources, topic sets, subject packs, series and mixed bundles; coupons; replaceable payment adapter; verified webhook unlock; order/content/price/validity snapshots.
5. Student library: deduplicate resources, retain purchase-specific grants, honour expiry and refunds without revoking another valid grant, preserve attempt limits across overlapping purchases.
6. Combined acceptance: one admin creates and publishes a set/material, sells it individually and in two differently priced bundles, and a student buys, accesses, resumes and reviews it. Include invalid imports, repeat payments, overlaps, expiry and refunds.

## TCS NQT boundary

The researched TCS hiring pattern distinguishes Foundation (75 minutes) and Advanced (115 minutes), including coding. Aptitude-only sets must be labelled as aptitude/sectional preparation, not a complete 190-minute coding-enabled NQT simulation. Do not hard-code a universal NQT pattern or a question count that the official source does not confirm.

Research sources used in the approved planning review:
- https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring
- https://support.learnyst.com/import-quiz-questions-from-the-excel-for-mock-test
- https://support.learnyst.com/add-questions-to-your-mock-test
- https://support.learnyst.com/add-products-to-the-bundle
- https://support.learnyst.com/create-a-bundles
- https://testbook.com/ssc-cgl/test-series

## Verification record

- Targeted Neon acceptance on isolated `phase-5-acceptance`: passed invalid-row no-write, cross-exam rejection, ordered section attachment, draft state, atomic publication including answer revisions/options, published-paper import rejection, independently priced standalone and mixed bundles reusing the same material, and unavailable-content rejection. Synthetic fixtures were removed.
- Unit tests, lint, TypeScript and production build are recorded with the delivery commit/PR.
- Browser visual acceptance is pending: the available remote browser refused the local development URL (`ERR_BLOCKED_BY_CLIENT`). No screenshot or end-to-end browser pass is claimed.
- Earlier long admin integration suite is not reclassified as passing. This targeted test does not cover the later student engine or commerce stages.

## Local acceptance after pulling this branch

Keep the existing feature database settings and secrets in `.env.local`; do not commit that file. The category/import-guard follow-up requires migration `0006_test_categories_import_guard`; no new environment variables. Before starting against a different development database, run `node --env-file=.env.local node_modules/drizzle-kit/bin.cjs migrate` with its direct `DATABASE_URL_UNPOOLED`.

1. Open Admin → Exams → the desired exam → Manage this exam's tests.
2. Create a draft test. Its Questions section is ready automatically.
3. Choose Write a question, or Import question set → topic → template → Check and preview → Add questions.
4. Inspect answers/explanations and order; publish the complete paper.
5. Open Store & materials. Select one published item for a standalone product, or several for a bundle; set each product's price and validity. The exam must be published for its content to appear in this selector.
6. Report browser errors and usability gaps before this draft PR is merged.


## Saved categories and repeat-import protection

- Admin can create/edit a Full mock, Subject test or Topic set and filter the list by type. Copying preserves the type. Existing papers retain a null category, displayed as Uncategorised, until an admin chooses one; no historical content is silently reclassified.
- Topic sets may publish only with one topic across all sections. Subject tests may contain multiple topics but only one subject. Full mocks may combine subjects. The publish statement reads the saved category rather than trusting an old page value. These are authoring categories within the existing on-demand MOCK mode, not a live-test feature or a promise of complete TCS coding simulation.
- CSV imports reserve a unique section + parsed-content fingerprint in the same SQL statement as the questions and assignments. Retrying identical parsed content (including CSV line-ending changes) returns a conflict and inserts nothing. Different papers/sections and changed content remain importable. Manual additions and contextual edits do not use this import guard.
- Protection applies to imports made after this change; old import records have no guard key. It does not detect partially overlapping or reordered CSV files. Removing individual imported questions does not clear the fingerprint: restore intentionally through manual entry or a changed question set.
- Migration 0006 adds nullable test category and nullable unique import key; it removes no data. Browser acceptance remains pending.


## Authoring selectors and bundle search

- Manual question creation/editing and in-test CSV import share an exam/subject/topic picker. Filters narrow choices without silently changing the selected topic; a selected item outside the filters stays visibly pinned. Changing the CSV topic invalidates its preview.
- Product creation filters published content by title, exam and test/material type. Selected-only view and a count help review the bundle. Selections are kept independently of visible results and submitted through hidden fields, so changing filters does not remove selected items or submit duplicate checkbox values.
- Existing draft bundles have searchable test/material link selectors (title/exam). Empty results cannot submit a missing item. Eligible material selectors now consistently require a published parent exam; available tests remain prepared MOCK papers.
- No schema migration or environment changes in this selector batch. List pagination, subject/topic filtering of the overall test list, and combined browser acceptance are still pending. Existing permissions and mutation validation apply.
