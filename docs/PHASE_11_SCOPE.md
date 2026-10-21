# Phase 11 — release readiness

Phase 11 is the release-evidence phase. Product phases 0–10 are implemented in `develop`; this phase must verify the complete system without introducing a second product plan.

## Implemented release foundations

- Resend delivery contract and verified Prepstore sender configuration.
- Responsive public, Student and Admin layouts with keyboard/focus support.
- Session, RBAC, MFA, CSRF/origin, security-header and protected-route controls.
- Razorpay checkout, verification, retry, webhook and payment-state handling.
- Local development storage and production S3-compatible private-object support.
- EC2 deployment target with health/readiness endpoints; no Vercel deployment dependency.
- Playwright viewport matrix and axe serious/critical accessibility checks for public and authenticated routes.

## Evidence required before release sign-off

1. Run public browser checks at 390×844, 768×1024, 1366×768 and 1920×1080.
2. Run the authenticated Student/Admin matrices with non-production storage-state files.
3. Exercise test refresh/autosave, invoice rendering, PDF/material reading and post-logout Back-button behaviour.
4. Verify production private storage and entitlement revocation.
5. Record monitoring plus database backup/restore evidence.
6. Verify Razorpay production credentials, webhook delivery, abandoned/failed/retried payments and reconciliation.
7. Run the final code gates, approve the release explicitly, promote `develop` to `main`, and deploy to EC2.

Passing source checks alone is not evidence of all-device correctness. Record viewport, route, account role, expected result, actual result and a screenshot for every failure.

## Deferred extensions

- Scheduled live/cohort test windows.
- Manual result-correction workflows.
- An Admin inbox for unauthenticated contact-form submissions.
- Inbound-email automation.

These items are not blockers for the approved on-demand mock-test product.
