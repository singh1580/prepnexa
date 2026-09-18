# PrepNexa

Temporary working name for a secure India-focused placement exam preparation platform.

## Architecture

- `src/app`: routes, layouts and HTTP boundaries only
- `src/features`: isolated business modules; each module owns its validation, service and repository
- `src/db`: database client and versioned Drizzle schema
- `src/lib`: shared technical utilities, never business rules
- `src/config`: validated runtime configuration
- `tests`: unit/integration/e2e suites
- `docs`: architecture decisions and operational runbooks

Rule: route -> feature service -> repository -> database. Routes must not contain payment, access or scoring rules.

## Authoritative planning documents

- `docs/PRODUCT_REQUIREMENTS.md` — MVP scope and business rules
- `docs/DELIVERY_PLAN.md` — phase order and completion gates
- `docs/PAYMENT_ARCHITECTURE.md` — provider-neutral payment boundary
- `docs/ARCHITECTURE.md` — technical architecture decisions
- `docs/ENGINEERING_STANDARDS.md` — enforced module, HTTP, error, logging, and testing rules
- `docs/DATABASE_DESIGN.md` — Phase 2 schema modules and integrity decisions
- `docs/AUTHENTICATION.md` — session, verification, reset, RBAC, and email-delivery rules

## Local setup

1. Copy `.env.example` to `.env.local` and use the Neon branch matching the current Git feature branch.
2. Run `npm ci`.
3. Run `npm run db:generate` only after changing the schema, then inspect the SQL migration.
4. Run `npm run db:migrate` only against that feature branch's direct Neon URL.
5. Run `npm run dev`.

Never commit `.env*`, gateway secrets, database credentials or real student data.
