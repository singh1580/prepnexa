# Prepstore implementation status — 28 October 2026

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
- On 28 October 2026, the launch-hardening delta passed ESLint, TypeScript, all 177 default Vitest checks and a full 73-page Next.js 16.4.1 production build.
- The hardening delta adds database-backed registration, recovery and MFA throttling, a five-attempt Admin MFA cap, 12-hour Admin sessions, trusted reverse-proxy IP extraction, same-origin enforcement for unsafe API requests, CSP, HSTS and strict production environment validation. Signed Razorpay webhooks remain the only cross-origin mutation exemption.
- Migration `0031_fair_toro.sql` was applied to the isolated Neon QA branch. Its atomic limit was proven to stop at five accepted operations and reject the sixth without exceeding the stored count.
- Public live search now performs a bounded database query and uses a 30-second server data cache instead of fetching and filtering the complete catalogue for every keystroke.
- On 27 October 2026, the current Tailwind release candidate passed ESLint, TypeScript, all 163 default Vitest checks and the final Next.js 16.4.1 production build, including all 73 generated static pages.
- On 26 October 2026, all four opt-in database integration suites passed individually against the isolated Neon `phase-11-browser-qa` branch: authentication, commerce, protected-material access and the complete Student attempt/autosave/submit/result flow. The integration runner preserves an explicitly supplied QA database URL instead of replacing it with the local placeholder.
- Student-attempt integration fixtures use unpublished paid products plus explicit test entitlements, so a running suite cannot expose synthetic packages in the public catalogue. Its successful run removed its own fixtures; the older incident-linked synthetic product remains unpublished because deleting its referenced QA attempt would be unsafe.
- Playwright and axe passed all 60 public route/viewport cases and all eight authentication route/viewport cases at 390×844, 768×1024, 1366×768 and 1920×1080.
- Authenticated Student/Admin responsive coverage passed all 80 route/viewport cases. Mobile and tablet coverage was completed through the full matrix plus targeted reruns after fixes; the final laptop and wide-desktop matrix passed 40/40. Storage-state files were temporary and credentials were not committed.
- Workflow automation passed payment-receipt responsiveness, protected two-page A4 PDF rendering on mobile and desktop, page navigation, absence of browser print/download controls, test answer autosave across refresh, Admin dialog focus/Escape behaviour, missing-cover fallback and post-logout Back-button protection.
- Production dependencies currently report three low-severity findings in the React Email text-rendering dependency chain and no moderate, high or critical findings. npm proposes an unsafe incompatible downgrade, so the chain must be updated when a compatible upstream release is available rather than forced.
- The full development audit reports four moderate findings in Drizzle Kit's deprecated internal `@esbuild-kit` chain. The project is already on the latest stable Drizzle Kit (`0.31.11`); npm's proposed remediation is an unsafe downgrade to `0.18.1`, so no forced downgrade or unsupported cross-major override is applied.
- On 22 October 2026, live production desktop checks covered the public route set, the Student workspace and all nine primary Admin sections plus representative test, package, order and support details. No page-level horizontal overflow or broken images were observed on those checked pages.
- The live Student check proved test answer/review autosave across refresh, invoice layout, logout dialog focus/Escape handling and post-logout Back-button protection. The earlier production material-reader failure was traced to an internal `localhost` redirect; the release candidate now uses a same-origin relative redirect and the isolated QA browser workflow proves the protected reader. EC2 post-deploy verification is still required.
- The live Admin check used password plus authenticator MFA through the secure browser handoff. The material dialog initially focused its Close control and closed with Escape without saving.

The normal Playwright browser download was unavailable in the work container, so the completed browser runs used an ephemeral compatible Chromium binary. That environment limitation is no longer an unexecuted-test blocker; EC2 post-deploy smoke remains a separate release check.

## 27 October 2026 regression checkpoint

- The cart, catalogue search, home package rails, result metrics, protected PDF reader, workspace navigation, Admin package cards and centered order/student details received targeted responsive fixes.
- Free packages now require an explicit active entitlement just like paid packages; zero-price checkout remains the acquisition path.
- Submitted attempts replace the attempt URL with the result URL, and reopening a closed attempt server-redirects to its result instead of rendering a stale runner.
- The contact page no longer exposes the legal-operator/entity/grievance-officer panel. Legal documents no longer print owner, entity type, street address or a named officer; verified public contact channels and the required grievance response process remain available.
- `src/app/tailwind.css` is the only application stylesheet. The obsolete plain-CSS layer was deleted, all remaining CSS-variable references resolve to active tokens and the application stylesheet contains zero `!important` declarations.
- A local production-server smoke returned HTTP 200 for home, cart, catalogue, contact, all four legal pages, login, signup, favicon, brand icon and health routes.
- Playwright still discovers all 176 responsive/accessibility/workflow cases. The current container no longer has the ephemeral Chromium binary and the standard download endpoint is unavailable, so the 27 October UI delta still requires the normal post-deploy four-viewport browser rerun; the earlier rendered baseline is not being presented as proof of this changed delta.

## 28 October 2026 launch-hardening checkpoint

- Unsafe `POST`, `PUT`, `PATCH` and `DELETE` API requests now require the canonical Prepstore origin or a same-origin Fetch Metadata signal. Cross-site and sibling-subdomain requests fail before route logic runs.
- Sensitive auth actions use one reusable, atomic database rate-limit implementation. Raw email addresses and IP addresses are never stored in the limiter table.
- Admin MFA login and enrollment are limited per account and per client IP. Admin sessions expire after 12 hours independently of Student session lifetime.
- Production startup rejects HTTP app URLs, local object storage, missing MFA encryption, mock payment and incomplete Razorpay configuration.
- CSP, short rollout HSTS, MIME, framing, referrer and browser-permission policies are covered by unit tests and production response smoke checks.
- `/api/ready` now verifies database connectivity and production configuration/private-storage construction; the release smoke validates the detailed readiness payload.
- Release preflight now fails when migration `0031` is absent or when live packages still use demo, sample or testing names.

## Compatibility decisions

- Authentication uses only the `prepstore_session` cookie. The pre-launch legacy cookie fallback has been removed so the production contract contains no obsolete session name.
- Historical migration identifiers, database names and migration text containing `Prepnexa` are immutable operational history and are not user-visible branding.
- New user-facing and active configuration names use Prepstore.

## CSS consolidation

- Tailwind CSS 4 is the active component/layout styling system. Responsive behaviour now lives with the affected JSX through direct utilities instead of accumulating selector overrides.
- `src/app/tailwind.css` is the single application stylesheet. It contains the Tailwind import, shared theme tokens, browser defaults, focus/selection, reduced-motion, print rules and the drawer animation.
- The former `storefront-fixes.css`, `brand-system.css`, `final-review-polish.css` and contact CSS module are removed rather than retained as later override layers.
- No `!important` declaration or historical component/layout selector layer remains in the application stylesheet.
- Source-level responsive regression checks and rendered Playwright checks cover the migrated public, authentication, Student, Admin, checkout, test-runner, invoice and protected-reader surfaces.

## Release evidence still required

1. Apply migration `0031_fair_toro.sql`, then run the updated preflight before restarting the app.
2. Unpublish or rename every live demo/testing package; the preflight intentionally blocks release while placeholder catalogue data is public.
3. Verify production S3-compatible storage, signed delivery and entitlement revocation against the configured provider.
4. Record external monitoring, EC2 recovery and database backup/restore evidence; these cannot be proven by repository tests alone.
5. Complete Razorpay production-key, webhook, failed-payment, retry and reconciliation acceptance under the enforced CSP.
6. Run the post-deploy public and authenticated four-viewport browser matrix; the container's Chromium download failure is not an application pass.

An inbound contact-form inbox inside Admin is intentionally deferred. The present form stores every genuine enquiry with a reference and sends it through Resend to `contactprepstore@gmail.com`; the authenticated support centre remains the in-app ticket workflow.
