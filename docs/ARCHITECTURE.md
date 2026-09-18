# Architecture decisions

## Modular monolith

One deployable Next.js application with strict feature boundaries. This keeps the MVP operationally simple while making errors traceable to a module. Payments, test execution and analytics can later move to separate services without rewriting their domain contracts.

## Error trace path

Every request will receive a request ID. Route handlers validate input, feature services enforce business rules, repositories perform database work, and `AppError` carries a stable machine code. Logs must contain request ID, module, action and safe identifiers; secrets and answers are redacted.

## Data integrity

Money uses integer paise. Orders, payments and entitlements remain separate. Webhook event IDs are unique for idempotency. Test deadlines are server-controlled. Published questions are immutable during an active live test; future work will add explicit question revisions/snapshots before live launch.

## Branch mapping

- Git `main` -> Neon `production`
- Git `develop` and feature branches -> Neon `development` or short-lived child branches
- Migrations use `DATABASE_URL_UNPOOLED`; normal runtime uses pooled `DATABASE_URL`
