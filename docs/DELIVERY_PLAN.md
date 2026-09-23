# Phase-Gated Delivery Plan

Work moves to the next phase only after the current phase's checks pass. Production schema and production credentials are not used during feature development.

| Phase | Deliverable | Completion gate |
|---|---|---|
| 0 | Product requirements and business rules | Rules reviewed; unresolved items recorded explicitly |
| 1 | Architecture and engineering standards | Boundaries, error contract, logging, CI, and test strategy verified |
| 2 | Final database model | Migration, constraints, seeds, and integration tests pass on Neon development |
| 3 | Authentication and RBAC | Session, reset, verification, authorization, and admin 2FA tests pass |
| 4 | Public catalogue | Responsive exam/package pages and free-test entry complete |
| 5 | Admin content management | Single-admin draft/preview/publish and bulk-import flows pass permission tests |
| 6 | Test engine | Timer, autosave, reconnect, snapshots, and auto-submit pass concurrency tests |
| 7 | Results and analytics | Scoring, release, rank, percentile, and recalculation are reproducible |
| 8 | Provider-neutral commerce | Coupons, mock provider and selected adapter pass checkout/webhook/refund/idempotency tests |
| 9 | Protected materials | Entitlement checks, signed access, watermarking, and audit trail work |
| 10 | Dashboards and support | Student/admin workflows, notifications, and tickets complete |
| 11 | Release readiness | Security, accessibility, load, backup/restore, monitoring, and beta checks pass |

## Branch and database policy

- `main` maps to the production application and production database branch.
- `develop` is the integration branch.
- Each material feature uses a short-lived Git branch and, when schema changes are involved, an isolated Neon branch.
- Schema migrations are reviewed as SQL before execution.
- Production migrations require a verified restore point and post-migration checks.

## Definition of done for every feature

- Validation, service, repository, and permission boundaries are respected.
- Unit and integration tests cover success, failure, duplicate, and unauthorized cases.
- Errors use a stable code and safe user-facing message.
- Logs include request ID and module/action but no secrets.
- Database queries have required indexes and ownership filters.
- Mobile and keyboard behavior is checked when UI is involved.
- Documentation and environment examples are updated.

Current evidence and outstanding work: see PROJECT_STATUS.md. A table or permission definition alone does not complete a feature.


## Mock-first scope update
Live tests and standalone practice-mode creation are deferred by the owner. Existing database modes/schedules remain for compatibility. Current test creation is MOCK only; free diagnostic and paid mock packages remain. Students start a prepared test on demand and its timer begins at attempt creation (Phase 6). Live scheduling is not part of current acceptance.

This update hides schedule controls, rejects non-mock creation/publication, fixes async form reset, adds draft question/empty-section removal and prevents publishing papers with empty sections. Student attempts, snapshots, timer, autosave/resume and submission are delivered in Phase 6; scoring and result review remain Phase 7.


## Approved test-centred simplification
See [ADMIN_SIMPLIFICATION.md](ADMIN_SIMPLIFICATION.md) for the approved scope, delivered test/import/product-assembly changes, verification evidence and remaining student/material/commerce work. This supersedes the earlier question-bank-first authoring flow; prepared topic and subject practice sets remain in scope, while live scheduling stays deferred. Phase 5 browser acceptance is still pending.

## Phase 6 execution delivery

See [PHASE_6_SCOPE.md](PHASE_6_SCOPE.md). The current gate covers server-authoritative start/deadline, immutable snapshots, a database-enforced single active attempt, versioned autosave, resume, manual/automatic submission and a responsive Student runner. Phase 7 owns deterministic scoring and result analytics. Consolidated browser/visual acceptance is deferred by the owner until the full planned platform is complete.

## Phase 7 scoring delivery

See [PHASE_7_SCOPE.md](PHASE_7_SCOPE.md). On-demand mocks publish immediate snapshot-based results with negative marking, accuracy, time, section/topic performance and protected answer explanations. Rank/percentile is shown only when a real ranking cohort is enabled; current live/cohort functionality remains deferred. Consolidated browser/visual acceptance remains at the final platform gate.

## Phase 8 commerce delivery

See [PHASE_8_SCOPE.md](PHASE_8_SCOPE.md). The implementation covers single-product checkout, server-side pricing, coupon reservations/limits, free orders, provider-neutral attempts, verified idempotent capture, entitlements, order history and Admin refunds/coupon controls. The mock adapter is non-production only. A real gateway remains an explicit deployment decision and does not require changing core order/access rules.

## Phase 9 protected-material delivery

See [PHASE_9_SCOPE.md](PHASE_9_SCOPE.md). Admin now uploads private PDFs/study files without handling object keys, versions them and attaches published material to existing products/bundles. Students receive an entitlement-filtered library, short-lived signed access, fresh revocation checks, checksummed delivery, PDF watermarking and access logs. Storage is provider-neutral because the current Neon region cannot enable Neon Object Storage beta.

## Phase 10 operational delivery

See [PHASE_10_SCOPE.md](PHASE_10_SCOPE.md). Student summaries, active-device controls, in-app notifications and support are implemented in the Student workspace. Permission-gated student management, support, delivery retry, activity and operational metrics stay in the single Admin workspace. Owner-wide grants and production provider configuration remain explicit deployment actions.

## Phase 11 release delivery

See [PHASE_11_SCOPE.md](PHASE_11_SCOPE.md). Resend configuration and application email acceptance come first, followed by consolidated browser/UI/accessibility, security, performance, production storage, monitoring and restore checks. The real payment gateway is integrated last, after those checks are stable. Promotion to `main` and production deployment require explicit release approval.
