# Local release-candidate acceptance

Use an isolated, fully migrated QA database and QA accounts. Never run this workflow against the production database or with real student data.

## 1. Prepare the runtime

Requirements: Node.js 22 or newer, npm and Chromium dependencies supported by Playwright.

```bash
npm ci
npm run test:e2e:install
cp .env.example .env.local
```

Set the environment without sharing or committing secrets:

- `DATABASE_URL`: pooled URL for the isolated QA database.
- `DATABASE_URL_UNPOOLED`: direct URL for the same isolated QA database.
- `AUTH_SECRET`, `PASSWORD_PEPPER`, `MFA_ENCRYPTION_KEY`: three different random values.
- `RESEND_API_KEY` and `EMAIL_FROM="Prepstore <no-reply@prepstore.in>"` for real email acceptance.
- `PAYMENT_PROVIDER=mock` only for local application-flow checks. Use Razorpay test credentials for gateway acceptance.
- `STORAGE_PROVIDER=local` only for local file-flow checks. Use the configured private provider for release acceptance.

Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Generate each local secret independently, for example with `openssl rand -hex 32`.

## 2. Prove prerequisites

```bash
npm run qa:preflight
```

If the isolated database is not current, migrate and seed it, then repeat preflight:

```bash
npm run db:migrate
npm run db:seed
```

The RBAC seed does not create or reset Admin credentials. Use a dedicated QA Admin account and authenticator.

## 3. Start and smoke-check

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run qa:smoke
```

The smoke command checks public routes, database readiness, security headers, latency and protected workspace redirects.

## 4. Automated browser gate

Public checks need no credentials:

```bash
npm run test:e2e
```

For authenticated coverage, create Playwright storage-state files using QA accounts and keep them outside version control. Then run:

```bash
E2E_STUDENT_STORAGE_STATE=/absolute/path/student.json \
E2E_ADMIN_STORAGE_STATE=/absolute/path/admin.json \
npm run test:e2e
```

The suite runs at 390×844, 768×1024, 1366×768 and 1920×1080. It checks page-level overflow, broken images and serious/critical axe findings. Conditional authenticated tests are reported as skipped when their storage state is not supplied; a skipped matrix is not a release pass.

The stateful receipt, protected-reader and autosave tests additionally require a disposable hidden workflow fixture. Seed it only against the isolated QA database, keep the generated JSON outside the repository, and clean it after the run:

```bash
E2E_STUDENT_ID=<qa-student-id> \
E2E_WORKFLOW_FIXTURE=/tmp/prepstore-workflow-fixture.json \
node --import tsx scripts/qa-e2e-workflow-fixture.ts seed

E2E_STUDENT_STORAGE_STATE=/absolute/path/student.json \
E2E_ADMIN_STORAGE_STATE=/absolute/path/admin.json \
E2E_WORKFLOW_FIXTURE=/tmp/prepstore-workflow-fixture.json \
npm run test:e2e -- tests/e2e/authenticated-workflows.spec.ts

E2E_WORKFLOW_FIXTURE=/tmp/prepstore-workflow-fixture.json \
node --import tsx scripts/qa-e2e-workflow-fixture.ts cleanup
```

Run the destructive logout-history proof last by adding `E2E_RUN_LOGOUT=true`; it invalidates the Student storage state.

## 5. Manual workflow

### Student

1. Sign up, accept the linked policies and complete real email verification.
2. Sign in, update profile/security details and inspect active devices.
3. Browse packages, complete a free or Razorpay-test checkout, and confirm the order plus entitlement.
4. Start a test, answer every supported question type, mark for review, refresh to prove resume/autosave, and submit.
5. Review results and explanations; open entitled PDF/file/video/article material.
6. Read notifications, create/reply to a support ticket, sign out, then confirm Back and refresh cannot expose protected content.
7. Complete password reset from the real email link.

### Admin

1. Sign in with QA Admin credentials and MFA.
2. Create/edit/import, preview, publish, copy and archive eligible content.
3. Create/edit/publish a package, coupon and material; upload a QA file and link it.
4. Review Student, order/payment, refund, support, notification-delivery, audit and metric screens.
5. Reply to the Student ticket and verify the Student notification.

### UI and accessibility

- Check mobile, tablet, laptop and wide desktop without page-level horizontal overflow.
- Use keyboard-only navigation for menus, forms, dialogs, test runner and logout.
- Verify dialog focus, accessible names, visible focus, skip links, errors, loading/disabled states and empty states.
- Check invoice/PDF/material reader layout and sensitive Back-button behaviour after logout.

Record route, role, viewport, action, expected result, actual result and screenshot for every failure.

## 6. Code gate

```bash
npm run qa:code
npm run build
```

Production storage, monitoring/restore, Razorpay production reconciliation, `main` promotion and EC2 deployment remain explicit release actions. This project has no Vercel deployment step.

## 7. EC2 post-deploy material check

Keep the public app URL set to `https://prepstore.in`. The material access endpoint now returns a relative same-origin redirect, but the reverse proxy should still forward the original request context:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

After deployment, sign in with an entitled QA Student and open one PDF/material from its course. In browser network tools confirm that the 303 `Location` starts with `/api/materials/` and that no request targets `localhost`. Also verify inline reading, authorised download when enabled, and denial for a non-entitled Student.
