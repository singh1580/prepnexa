import { AppError } from "@/lib/errors/app-error";
import { env } from "@/config/env";
import { createOpaqueToken, hashIdentifier, hashPassword, normalizeEmail, verifyPassword } from "./crypto";
import { authNotifier } from "./notifier";
import { ADMIN_ROLE_KEYS, TOKEN_PURPOSE } from "./constants";
import { consumeEmailVerification, consumePasswordReset, countRecentFailedAttempts, createSession, createUserWithVerification, findActiveTotpFactor, findRoleKeysForUser, findUserByEmail, recordLoginAttempt, replaceVerificationToken, revokeSession, touchLastLogin } from "./repository";
import type { EmailInput, LoginInput, RegisterInput, ResetPasswordInput } from "./validation";

const genericCredentialsError = () => new AppError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);

export async function register(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  if (await findUserByEmail(email)) throw new AppError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
  const { token, tokenHash } = createOpaqueToken();
  const user = await createUserWithVerification({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password), tokenHash, expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 3_600_000) });
  const emailSent = await authNotifier.sendEmailVerification({ to: user.email, name: user.name, token });
  return { user, emailSent };
}

export async function login(input: LoginInput, context: { ip?: string; userAgent?: string }) {
  const email = normalizeEmail(input.email);
  const emailHash = hashIdentifier(email);
  const ipHash = context.ip ? hashIdentifier(context.ip) : undefined;
  const since = new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60_000);
  const failedAttempts = await countRecentFailedAttempts(emailHash, ipHash, since);
  if (failedAttempts.email >= env.LOGIN_MAX_ATTEMPTS || failedAttempts.ip >= env.LOGIN_IP_MAX_ATTEMPTS) {
    throw new AppError("TOO_MANY_LOGIN_ATTEMPTS", "Too many login attempts. Please try again later.", 429);
  }
  const user = await findUserByEmail(email);

  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    await recordLoginAttempt({ emailHash, ipHash, succeeded: false, failureReason: "INVALID_CREDENTIALS" });
    throw genericCredentialsError();
  }
  if (user.status !== "ACTIVE") {
    await recordLoginAttempt({ emailHash, ipHash, succeeded: false, failureReason: user.status });
    throw new AppError("ACCOUNT_NOT_ACTIVE", "This account is not active.", 403);
  }

  const roles = await findRoleKeysForUser(user.id);
  if (roles.some((role) => ADMIN_ROLE_KEYS.has(role))) {
    const mfaSetupRequired = !await findActiveTotpFactor(user.id);
    const challenge = createOpaqueToken();
    const expiresAt = new Date(Date.now() + env.MFA_CHALLENGE_TTL_MINUTES * 60_000);
    await replaceVerificationToken({ userId: user.id, purpose: TOKEN_PURPOSE.MFA_LOGIN, tokenHash: challenge.tokenHash, expiresAt });
    return { mfaRequired: true as const, mfaSetupRequired, challengeToken: challenge.token, expiresAt, user: { id: user.id, name: user.name, email: user.email } };
  }

  const { token, tokenHash } = createOpaqueToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  await createSession({ userId: user.id, tokenHash, ipHash, userAgent: context.userAgent?.slice(0, 1000), expiresAt });
  await Promise.all([touchLastLogin(user.id), recordLoginAttempt({ emailHash, ipHash, succeeded: true })]);
  return { mfaRequired: false as const, token, expiresAt, user: { id: user.id, name: user.name, email: user.email } };
}

export async function logout(token: string | undefined) {
  if (token) await revokeSession(hashIdentifier(token));
}

export async function resendEmailVerification(input: EmailInput) {
  const user = await findUserByEmail(normalizeEmail(input.email));
  if (!user || user.status !== "PENDING_VERIFICATION") return { accepted: true };
  const { token, tokenHash } = createOpaqueToken();
  await replaceVerificationToken({ userId: user.id, purpose: TOKEN_PURPOSE.EMAIL_VERIFICATION, tokenHash, expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 3_600_000) });
  await authNotifier.sendEmailVerification({ to: user.email, name: user.name, token });
  return { accepted: true };
}

export async function verifyEmail(token: string) {
  if (!await consumeEmailVerification(hashIdentifier(token))) throw new AppError("INVALID_OR_EXPIRED_TOKEN", "This verification link is invalid or expired.", 400);
  return { verified: true };
}

export async function requestPasswordReset(input: EmailInput) {
  const user = await findUserByEmail(normalizeEmail(input.email));
  if (!user || user.status === "DELETED") return { accepted: true };
  const { token, tokenHash } = createOpaqueToken();
  await replaceVerificationToken({ userId: user.id, purpose: TOKEN_PURPOSE.PASSWORD_RESET, tokenHash, expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000) });
  await authNotifier.sendPasswordReset({ to: user.email, name: user.name, token });
  return { accepted: true };
}

export async function resetPassword(input: ResetPasswordInput) {
  const userId = await consumePasswordReset(hashIdentifier(input.token), await hashPassword(input.password));
  if (!userId) throw new AppError("INVALID_OR_EXPIRED_TOKEN", "This password reset link is invalid or expired.", 400);
  return { passwordReset: true };
}
