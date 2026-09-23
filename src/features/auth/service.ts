import { AppError } from "@/lib/errors/app-error";
import { env } from "@/config/env";
import { createOpaqueToken, hashIdentifier, hashPassword, normalizeEmail, verifyPassword } from "./crypto";
import { authNotifier } from "./notifier";
import { ADMIN_ROLE_KEYS, TOKEN_PURPOSE } from "./constants";
import { consumeEmailVerification, consumePasswordReset, countRecentFailedAttempts, createSession, createUserWithVerification, findActiveTotpFactor, findRoleKeysForUser, findUserByEmail, recordLoginAttempt, replaceVerificationToken, revokeSession, touchLastLogin } from "./repository";
import type { EmailInput, LoginInput, RegisterInput, ResetPasswordInput } from "./validation";
import { queueStudentNotification } from "@/features/operations/service";

const genericCredentialsError = () => new AppError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);

export async function register(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  if (await findUserByEmail(email)) throw new AppError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
  const { token, tokenHash } = createOpaqueToken();
  const user = await createUserWithVerification({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password), tokenHash, expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 3_600_000) });
  const emailSent = await authNotifier.sendEmailVerification({ to: user.email, name: user.name, token });
  return { user, emailSent };
}

export async function login(input: LoginInput, context: { ip?: string; userAgent?: string; requestId?: string }) {
  const email = normalizeEmail(input.email);
  const emailHash = hashIdentifier(email);
  const ipHash = context.ip ? hashIdentifier(context.ip) : undefined;
  const since = new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60_000);
  const failedAttempts = await countRecentFailedAttempts(emailHash, ipHash, since);
  const user = await findUserByEmail(email);
  if (failedAttempts.email >= env.LOGIN_MAX_ATTEMPTS || failedAttempts.ip >= env.LOGIN_IP_MAX_ATTEMPTS) {
    if (user?.status === "ACTIVE") await queueSuspiciousLogin(user.id, emailHash, context.requestId ?? crypto.randomUUID());
    throw new AppError("TOO_MANY_LOGIN_ATTEMPTS", "Too many login attempts. Please try again later.", 429);
  }

  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    await recordLoginAttempt({ emailHash, ipHash, succeeded: false, failureReason: "INVALID_CREDENTIALS" });
    if (user?.status === "ACTIVE" && failedAttempts.email + 1 >= env.LOGIN_MAX_ATTEMPTS) await queueSuspiciousLogin(user.id, emailHash, context.requestId ?? crypto.randomUUID());
    throw genericCredentialsError();
  }
  if (user.status !== "ACTIVE") {
    await recordLoginAttempt({ emailHash, ipHash, succeeded: false, failureReason: user.status });
    if (user.status === "PENDING_VERIFICATION") {
      throw new AppError("EMAIL_NOT_VERIFIED", "Verify your email before signing in. You can request a new verification link below.", 403);
    }
    if (user.status === "SUSPENDED") {
      throw new AppError("ACCOUNT_SUSPENDED", "This account is suspended. Contact support if you believe this is a mistake.", 403);
    }
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
  await createSession({ userId: user.id, tokenHash, ipHash, userAgent: context.userAgent?.slice(0, 1000), expiresAt }, env.MAX_ACTIVE_SESSIONS);
  await Promise.all([touchLastLogin(user.id), recordLoginAttempt({ emailHash, ipHash, succeeded: true })]);
  return { mfaRequired: false as const, token, expiresAt, user: { id: user.id, name: user.name, email: user.email } };
}

async function queueSuspiciousLogin(userId:string,emailHash:string,requestId:string) {
  const window=Math.floor(Date.now()/(env.LOGIN_WINDOW_MINUTES*60_000));
  await queueStudentNotification({userId,type:"SUSPICIOUS_LOGIN",deduplicationKey:`suspicious-login:${emailHash}:${window}`,title:"Suspicious sign-in activity",body:"Several unsuccessful sign-in attempts were detected for your account. Reset your password if this wasn't you.",requestId});
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
