# Authentication and Authorization

PrepNexa owns its authentication data so sessions and RBAC remain explicit and auditable. HTTP routes only validate input and format responses; business rules live in `src/features/auth` and database access remains in its repository.

## Security model

- Passwords use Argon2id and an application-level `PASSWORD_PEPPER`.
- Session cookies contain a 256-bit opaque token. Only an HMAC-SHA-256 digest is stored in Postgres.
- Cookies are `HttpOnly`, `SameSite=Lax`, path-scoped to `/`, and `Secure` in production.
- Email verification and password-reset tokens are single-use, hashed at rest, purpose-bound, and time-limited.
- Password reset revokes every active session for the user in the same SQL statement.
- Login failures store hashed email/IP identifiers and enforce separate account and IP windows.
- Password-reset and resend-verification responses do not reveal whether an account exists.
- Authorization is resolved from `user_roles -> roles -> role_permissions -> permissions`; UI visibility is never treated as authorization.

## API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create a pending student and issue verification email |
| POST | `/api/auth/verify-email` | Consume verification token and activate account |
| POST | `/api/auth/resend-verification` | Replace prior verification token |
| POST | `/api/auth/login` | Validate credentials and create session cookie |
| POST | `/api/auth/logout` | Revoke current server-side session |
| GET | `/api/auth/me` | Return current user, roles, permissions, and expiry |
| POST | `/api/auth/request-password-reset` | Issue reset email with enumeration-safe response |
| POST | `/api/auth/reset-password` | Replace password and revoke all sessions |
| POST | `/api/auth/mfa/setup` | Generate an encrypted TOTP factor for a signed-in admin |
| POST | `/api/auth/mfa/confirm` | Confirm TOTP and return recovery codes once |
| POST | `/api/auth/mfa/verify-login` | Complete an admin login challenge |

## Administrator 2FA

Every non-student system role is treated as administrative. Password login for these roles creates a five-minute, single-use challenge instead of a session. The challenge is completed with either a six-digit TOTP code or a one-time recovery code. TOTP secrets are encrypted with AES-256-GCM using `MFA_ENCRYPTION_KEY`; recovery codes are HMAC-hashed and never retrievable after setup. The last accepted TOTP time-step is persisted so the same code cannot be replayed.

## Email adapter

Auth services call the provider boundary in `notifier.ts`. Resend is the first adapter, but tokens and business services contain no Resend-specific logic. Set both `RESEND_API_KEY` and `EMAIL_FROM` for delivery. When absent or temporarily failing, the token remains valid and delivery failure is logged without exposing the token.

## Route protection

Server routes call `requireAuthenticated()` or `requirePermission("permission.key")`. These functions validate the database session and active user status on every protected operation. The proxy only attaches request IDs; it must not replace database authorization.

## Integration test

Run against an isolated Neon branch only:

```bash
RUN_INTEGRATION_TESTS=true npm run test:integration
```

The test creates a temporary student, verifies email, checks RBAC, resets the password, confirms session revocation, and removes the temporary user.
