# Engineering Standards

## Module boundary

Application routes parse transport concerns and call feature services. Services own business rules and transactions. Repositories own queries. UI and route files cannot import the database directly.

Each material feature uses this shape when the files are required:

```text
src/features/<feature>/
  domain/          entities, value objects, and provider-independent types
  validation.ts   untrusted-input schemas
  permissions.ts  feature authorization rules
  repository.ts   database access
  service.ts      business rules and transaction orchestration
  errors.ts       stable feature error codes
  index.ts        intentionally public exports
```

Avoid placeholder files and generic `utils.ts`. Shared code moves to `src/lib` only after at least two real consumers exist and it contains no feature business rule.

## HTTP contract

Successful JSON responses use:

```json
{ "data": {}, "meta": { "requestId": "uuid" } }
```

Failed JSON responses use:

```json
{ "error": { "code": "STABLE_CODE", "message": "Safe message" }, "meta": { "requestId": "uuid" } }
```

Validation errors may include safe field details. Unexpected exceptions always become `INTERNAL_ERROR` and never expose stack traces, queries, or secrets.

## Errors and logs

- Error codes are stable uppercase identifiers; UI text may change independently.
- Expected business failures use `AppError` subclasses or feature error factories.
- Every request receives an `x-request-id` that is echoed in its response.
- Logs include request ID, module, action, and safe entity identifiers.
- Never log authorization headers, cookies, passwords, tokens, signatures, correct answers, full payment payloads, or private file links.

## Runtime and routes

- Use the default Node.js runtime unless an explicit, tested Edge requirement exists.
- Use Server Components by default and Client Components only for browser state or interaction.
- Use Server Actions for application UI mutations where appropriate.
- Use Route Handlers for webhooks, external integrations, health checks, and externally consumed APIs.
- Navigation functions must not be swallowed by broad `try/catch` blocks.

## Database rules

- Runtime traffic uses the pooled database URL; migrations use the direct URL.
- Schema changes require generated, reviewed migrations.
- Multi-record state transitions use transactions.
- Ownership and entitlement conditions belong in repository queries, not post-query UI filtering.
- Money uses integer minor units; timestamps include timezone.

## Test pyramid

- Unit: pure policy, scoring, validation, and mapping logic.
- Integration: repositories, transactions, constraints, sessions, entitlements, and idempotency.
- End-to-end: the smallest set of critical student/admin journeys.
- Security: authorization matrix, IDOR, replay, rate-limit, and unsafe-file cases.
- Load: live-test start, autosave, auto-submit, and rank processing.

Every defect fix receives a regression test at the lowest useful layer.
