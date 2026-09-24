# Local release-candidate acceptance

This is the single Phase 11 workflow for running PrepNexa in VS Code and checking the real Student/Admin experience. Use the isolated `phase-11-browser-qa` Neon branch. Do not use the production branch.

## 1. Prepare the runtime

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
cp .env.example .env.local
```

Set these values in `.env.local` without sharing or committing them:

- `DATABASE_URL`: pooled URL for the isolated QA branch.
- `DATABASE_URL_UNPOOLED`: direct URL for the same isolated QA branch.
- `AUTH_SECRET`, `PASSWORD_PEPPER`, `MFA_ENCRYPTION_KEY`: three different random values.
- `RESEND_API_KEY`: the existing Resend key.
- `EMAIL_FROM="PrepNexa <no-reply@prepstore.in>"`.
- `PAYMENT_PROVIDER=mock`: correct for this local review; real payment remains the final production step.
- `STORAGE_PROVIDER=local`: correct for local upload/download testing.

Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Generate local secrets with `openssl rand -hex 32` three times.

## 2. Prove prerequisites

```bash
npm run qa:preflight
```

This safely validates the environment, database connection, critical tables, the exact `ADMIN`/`STUDENT` role model, one Admin assignment, and provider selections. It never prints credentials. Do not continue until every blocking item passes. An email warning means real verification/reset mail will not work until Resend is configured.

If the isolated branch has not been migrated or seeded, run these once and then repeat preflight:

```bash
npm run db:migrate
npm run db:seed
```

The RBAC seed does not create or reset Admin credentials. Use the existing Admin account and authenticator already established for QA.

## 3. Start and smoke-check

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run qa:smoke
```

The smoke command checks public routes, database readiness, security headers, response time, and unauthenticated redirects for Student/Admin workspaces.

## 4. One-pass real workflow

Use a new email address you can open for the Student flow.

### Student

1. Sign up and open the real verification email from `PrepNexa <no-reply@prepstore.in>`.
2. Verify, sign in, update the profile, and check active devices.
3. Browse Exams, Packages, and Free tests on desktop and mobile widths.
4. Complete a free or mock-payment checkout and confirm the order plus granted access.
5. Start a test, answer each supported question type, mark for review, refresh to prove resume/autosave, and submit.
6. Review score, section/topic breakdown, answers, and explanations.
7. Open entitled material in My library and test allowed download/view behavior.
8. Read notifications, create a support ticket, reply, and sign out.
9. Request a password reset and complete it from the real email link.

### Admin

1. Sign in with the existing Admin credentials and TOTP/recovery setup.
2. Create/edit an exam taxonomy and create/import questions inside a test.
3. Build, preview, publish, copy, and archive eligible test content.
4. Create/edit/publish a package, coupon, and material; upload a local QA file and link it.
5. Review the Student, order/payment, refund, support, notification-delivery, audit, and metrics screens.
6. Reply to the Student ticket and verify the Student sees the response/notification.
7. Retry a failed delivery only if one exists; do not generate artificial production traffic.

### UI and accessibility

- Check 390 px mobile, tablet, and desktop widths; confirm no page-level horizontal overflow.
- Use only the keyboard for navigation, menus, forms, test runner, dialogs, and sign-out.
- Confirm skip links and visible focus, readable errors/success states, loading/disabled states, and usable empty states.
- Confirm sensitive pages cannot be viewed after sign-out with Back/refresh.

Record screen name, width, action, expected result, actual result, and a screenshot for anything that needs changing. UI refinements can then be handled as one follow-up batch.

## 5. Code gate

Before merging any follow-up changes:

```bash
npm run qa:code
```

Production private storage, production monitoring/restore evidence, the real payment gateway, `main` promotion, and production deployment are separate release actions. The real gateway remains last, after this local workflow/UI review is accepted.
