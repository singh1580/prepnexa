# Phase 11 — release readiness

Phase 11 is the only active delivery phase. Phases 0–10 are implemented and merged into `develop`. The product keeps exactly two roles (`STUDENT` and one `ADMIN`) and the existing Student/Admin workspaces.

## Agreed execution order

1. Configure and verify Resend with the verified `prepstore.in` sender.
2. Run consolidated browser, responsive UI, keyboard and accessibility acceptance.
3. Complete security and performance/load checks.
4. Select and verify production private-object storage.
5. Verify monitoring, backup/restore and beta readiness.
6. Integrate and verify the real production payment gateway last, after the application and UI checks are stable.
7. Promote `develop` to `main` and deploy only after the production checklist and explicit release approval.

## Resend checkpoint — 2026-09-23

- `prepstore.in` is verified in Resend with sending and receiving enabled.
- A real external delivery from `PrepNexa <no-reply@prepstore.in>` reached an external Gmail mailbox with Resend status `delivered`.
- The application environment example now uses that verified sender.
- Environment validation requires `RESEND_API_KEY` and `EMAIL_FROM` together and rejects `@resend.dev` senders in production.
- The API key remains a deployment secret and is never committed. Application-level signup, verification and password-reset acceptance still requires the key in the runtime environment.

Receiving being enabled at the domain level does not by itself create an inbound support workflow. PrepNexa support remains the authenticated in-app ticket system unless a separate inbound-email feature is approved later.

## Browser and accessibility checkpoint — 2026-09-23

- Created isolated Neon branch `phase-11-browser-qa` from the fully migrated Phase 10 QA branch; production remained untouched.
- HTTP smoke checks passed for the home page, exams, packages, free tests, login, signup, forgot-password and health routes. Unauthenticated Student/Admin routes redirected to login as expected.
- Fixed the public mobile header, which previously hid Exams, Packages, Free tests and Sign in. It now exposes an accessible mobile menu while preserving desktop navigation.
- Replaced the fixed three-column workspace mobile navigation with a single-row, horizontally scrollable navigation so the full Student/Admin link set does not cover the page.
- Added keyboard skip links for public and workspace content, focus styling for menu/select/textarea controls, reduced-motion support remains enabled, and 44px-class mobile targets are maintained.
- Lint, TypeScript, 76 unit tests and the 62-page production build pass after the changes.

The automated visual runner could not attach inside the current execution environment, so screenshot-level desktop/mobile inspection and authenticated click-through acceptance remain open; HTTP, rendered-markup and source-level checks are recorded separately rather than presenting them as visual proof.

## Deferred, non-blocking product extensions

- Live/cohort tests, rank and percentile.
- Manual result correction workflows.
- A separate inbound-email automation pipeline.
- Broader standalone practice creation beyond the approved prepared sets.

These extensions are not release blockers for the currently approved mock-test product.
