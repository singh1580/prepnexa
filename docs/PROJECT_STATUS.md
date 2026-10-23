# Prepstore implementation status — 23 October 2026

This document records the current repository state. Historical phase documents explain how the product evolved; they do not override this checkpoint.

## Current product

- Brand: **Prepstore**.
- Roles: exactly one `ADMIN` role type and the `STUDENT` role type.
- Runtime: Next.js 16.4.1 on Node.js 22.
- Data: PostgreSQL through Drizzle and versioned SQL migrations.
- Deployment target: EC2. The application has no Vercel deployment requirement.
- Payments: Razorpay checkout, verification, retry and webhook handling are implemented; the mock provider is restricted to non-production use.
- Email: Resend-backed branded HTML/plain-text transactional delivery through one provider boundary, with idempotency keys and in-app delivery records/retry support.
- Protected files: local storage for development and S3-compatible private storage for production; PDFs use an application-owned responsive PDF.js canvas reader.

## Implemented journeys

- Public catalogue, package details, cart, billing and checkout.
- Signup with policy consent, attempt/rate-limited six-digit email OTP verification, login, password reset, profile and password changes.
- Student dashboard, purchases, entitled courses/materials, test attempts with autosave, results, notifications and support.
- Student Review & Feedback for paid packages, with private feedback and moderation status.
- Admin content, packages, materials, tests, students, orders, refunds, review moderation, notification delivery and support operations.
- Legal documents, a branded contact form and authenticated support routing.
- Responsive public/workspace shells, skip links, focus styles and reduced-motion handling.

## Verification checkpoint

- ESLint, TypeScript, Vitest and the production build are repository gates.
- On 22 October 2026, all four opt-in database integration suites passed against the isolated Neon `phase-11-browser-qa` branch: authentication, commerce, protected-material access and the complete Student attempt/autosave/submit/result flow. The integration runner now preserves an explicitly supplied QA database URL instead of replacing it with the local placeholder.
- Student-attempt integration fixtures use unpublished paid products plus explicit test entitlements, so a running suite cannot expose synthetic packages in the public catalogue. Its successful run removed its own fixtures; the older incident-linked synthetic product remains unpublished because deleting its referenced QA attempt would be unsafe.
- Playwright and axe checks cover public pages at 390 px mobile, tablet, laptop and wide-desktop viewports.
- Authenticated Student/Admin Playwright checks use supplied storage-state files so credentials are never committed.
- Production dependencies currently report no known npm audit vulnerabilities.
- On 22 October 2026, live production desktop checks covered the public route set, the Student workspace and all nine primary Admin sections plus representative test, package, order and support details. No page-level horizontal overflow or broken images were observed on those checked pages.
- The live Student check proved test answer/review autosave across refresh, invoice layout, logout dialog focus/Escape handling and post-logout Back-button protection. The production material reader failure was traced to an internal `localhost` redirect and is fixed in this release candidate; it must be rechecked after deployment.
- The live Admin check used password plus authenticator MFA through the secure browser handoff. The material dialog initially focused its Close control and closed with Escape without saving.

Browser automation still requires a machine on which Playwright Chromium can be installed. The current container could not download that browser binary, so the test definitions are committed but an all-device browser pass must be recorded from CI or the release host before claiming final acceptance.

## Compatibility decisions

- Authentication uses only the `prepstore_session` cookie. The pre-launch legacy cookie fallback has been removed so the production contract contains no obsolete session name.
- Historical migration identifiers, database names and migration text containing `Prepnexa` are immutable operational history and are not user-visible branding.
- New user-facing and active configuration names use Prepstore.

## CSS consolidation

- The application loads one global stylesheet: `src/app/styles.css`.
- The former `storefront-fixes.css`, `brand-system.css` and `final-review-polish.css` layers were merged and removed rather than retained as later overrides.
- Exact selector declarations already superseded in the same media/support context were removed during consolidation.
- The remaining stylesheet still contains legacy `!important` declarations. They are now in one auditable source, but reducing them further is maintenance work and must be done component-by-component with viewport regression evidence.

## Release evidence still required

1. Run the Playwright matrix with QA Student/Admin storage states and record the authenticated workflow result.
2. Verify production S3-compatible storage, signed delivery and entitlement revocation against the configured provider.
3. Record monitoring, database backup and restore evidence.
4. Complete Razorpay production-key, webhook, failed-payment, retry and reconciliation acceptance.
5. Promote `develop` to `main` and deploy only after explicit release approval.

An inbound contact-form inbox inside Admin is intentionally deferred. The present form stores every genuine enquiry with a reference and sends it through Resend to `contactprepstore@gmail.com`; the authenticated support centre remains the in-app ticket workflow.
