# Prepstore implementation status — 22 October 2026

This document records the current repository state. Historical phase documents explain how the product evolved; they do not override this checkpoint.

## Current product

- Brand: **Prepstore**.
- Roles: exactly one `ADMIN` role type and the `STUDENT` role type.
- Runtime: Next.js 16.4.1 on Node.js 22.
- Data: PostgreSQL through Drizzle and versioned SQL migrations.
- Deployment target: EC2. The application has no Vercel deployment requirement.
- Payments: Razorpay checkout, verification, retry and webhook handling are implemented; the mock provider is restricted to non-production use.
- Email: Resend-backed transactional delivery with in-app delivery records and retry support.
- Protected files: local storage for development and S3-compatible private storage for production.

## Implemented journeys

- Public catalogue, package details, cart, billing and checkout.
- Signup with policy consent, email verification, login, password reset, profile and password changes.
- Student dashboard, purchases, entitled courses/materials, test attempts with autosave, results, notifications and support.
- Admin content, packages, materials, tests, students, orders, refunds, notification delivery and support operations.
- Legal documents, a branded contact form and authenticated support routing.
- Responsive public/workspace shells, skip links, focus styles and reduced-motion handling.

## Verification checkpoint

- ESLint, TypeScript, Vitest and the production build are repository gates.
- Playwright and axe checks cover public pages at 390 px mobile, tablet, laptop and wide-desktop viewports.
- Authenticated Student/Admin Playwright checks use supplied storage-state files so credentials are never committed.
- Production dependencies currently report no known npm audit vulnerabilities.

Browser automation still requires a machine on which Playwright Chromium can be installed. The current container could not download that browser binary, so the test definitions are committed but an all-device browser pass must be recorded from CI or the release host before claiming final acceptance.

## Compatibility decisions

- The `prepnexa_session` cookie name is intentionally retained for now. Renaming it would invalidate every existing session and sign users out.
- Historical migration identifiers, database names and migration text containing `Prepnexa` are immutable operational history and are not user-visible branding.
- New user-facing and active configuration names use Prepstore.

## Release evidence still required

1. Run the Playwright matrix with QA Student/Admin storage states and record the authenticated workflow result.
2. Verify production S3-compatible storage, signed delivery and entitlement revocation against the configured provider.
3. Record monitoring, database backup and restore evidence.
4. Complete Razorpay production-key, webhook, failed-payment, retry and reconciliation acceptance.
5. Promote `develop` to `main` and deploy only after explicit release approval.

An inbound contact-form inbox inside Admin is intentionally deferred. The present form stores every genuine enquiry with a reference and sends it through Resend to `contactprepstore@gmail.com`; the authenticated support centre remains the in-app ticket workflow.
