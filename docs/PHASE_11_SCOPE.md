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

## 22 October 2026 live checkpoint

- Production desktop public routes: checked without broken images or page-level horizontal overflow.
- Production desktop Student routes: dashboard, courses/course overview, orders, notifications, support, profile, invoice and material-reader entry checked.
- Student test persistence: an answer and review flag survived refresh and navigation; the attempt was deliberately left in progress rather than submitted.
- Logout security: Escape closed the focused confirmation dialog; confirmed logout returned browser Back to the login/session-expired screen rather than protected content.
- Production desktop Admin routes: dashboard, materials, tests, packages, coupons, orders, students, support and notifications checked, with representative dynamic detail pages.
- Admin authentication: password and authenticator MFA completed using a secure credential handoff; no credential or OTP entered chat or logs.
- Material reader: current production failed because the access route emitted `https://localhost:3000/...` behind the EC2 proxy. The release candidate now returns a same-origin relative `Location` header with `private, no-store`; post-deploy verification remains required.
- At this checkpoint the four-viewport run was initially blocked by the standard Chromium download. The 26 October checkpoint below supersedes that limitation with completed execution using an ephemeral compatible Chromium binary.

## 26 October 2026 Tailwind and browser checkpoint

- Public, authentication, Student, Admin, commerce, test-runner, invoice and protected-reader layouts have been migrated to Tailwind CSS 4 utilities while preserving their existing product structure and behaviour.
- The previous global component selector and override layers are removed. Only the Tailwind entry/theme file and a minimal reset/token/print stylesheet remain, with zero `!important` declarations.
- The migration passes ESLint, TypeScript, all 160 default Vitest checks and the final Next.js 16.4.1 production build, including all 73 generated static pages.
- All four isolated database integration suites pass: authentication, commerce, protected materials and Student attempts.
- Playwright/axe passes 60/60 public cases and 8/8 authentication cases across 390×844, 768×1024, 1366×768 and 1920×1080.
- Authenticated responsive coverage passes all 80 Student/Admin route/viewport cases; the final laptop and wide-desktop matrix passes 40/40.
- Automated workflow evidence passes receipt responsiveness, protected A4 PDF rendering and navigation, test autosave across refresh, Admin dialog focus/Escape, missing-cover fallback and post-logout Back-button protection.
- The work container used an ephemeral compatible Chromium binary because the standard Playwright download endpoint was unavailable. The browser matrix was executed; this is not an outstanding acceptance item.

## Deferred extensions

- Scheduled live/cohort test windows.
- Manual result-correction workflows.
- An Admin inbox for unauthenticated contact-form submissions.
- Inbound-email automation.

These items are not blockers for the approved on-demand mock-test product.

## 27 October 2026 regression delta

- The release candidate now uses one Tailwind stylesheet; the former plain-CSS reset/compatibility file was consolidated and deleted.
- Responsive regressions reported in cart, home rails, PDF reading, result metrics, workspace navigation and Admin details have targeted source checks and production-build coverage.
- The local production HTTP smoke passed the public/auth/legal route set and brand assets without a 500 response.
- The existing 176-case Playwright matrix is discoverable, but this changed delta must be rerun after EC2 deployment because the current work container cannot obtain a compatible Chromium binary.
