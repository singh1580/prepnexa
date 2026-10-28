import { AppError } from "@/lib/errors/app-error";
import { env } from "@/config/env";
import { createEmailVerificationOtp, createOpaqueToken, hashEmailVerificationOtp, hashIdentifier, hashPassword, normalizeEmail, verifyPassword } from "./crypto";
import { authNotifier } from "./notifier";
import { ADMIN_ROLE_KEYS, TOKEN_PURPOSE } from "./constants";
import { consumeEmailVerificationOtp, consumePasswordReset, countRecentFailedAttempts, createSession, createUserWithVerification, findActiveTotpFactor, findRoleKeysForUser, findUserByEmail, findUserById, findUserByLogin, getEmailVerificationSendState, recordLoginAttempt, replaceVerificationToken, revokeSession, touchLastLogin, updatePassword } from "./repository";
import type { EmailInput, LoginInput, RegisterInput, ResetPasswordInput } from "./validation";
import { queueStudentNotification } from "@/features/operations/service";
import { LEGAL_POLICY_VERSION } from "@/config/legal";
import { enforceRateLimit } from "./rate-limit";

const genericCredentialsError = () => new AppError("INVALID_CREDENTIALS", "Email, phone number or password is incorrect.", 401);

export async function register(input: RegisterInput, context: { ip?: string } = {}) {
  const email = normalizeEmail(input.email);
  if (context.ip) await enforceRateLimit({ action: "auth.register.ip", identifier: context.ip, maximum: env.REGISTER_IP_MAX_ATTEMPTS, windowSeconds: 60 * 60 });
  if (await findUserByEmail(email)) throw new AppError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
  const { code, tokenHash } = createEmailVerificationOtp(email);
  const user = await createUserWithVerification({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password), tokenHash, expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_OTP_TTL_MINUTES * 60_000), legalAcceptedAt: new Date(), legalAcceptedVersion: LEGAL_POLICY_VERSION });
  const emailSent = await authNotifier.sendEmailVerification({ to: user.email, name: user.name, code, deliveryId: tokenHash.slice(0, 24) });
  return { user, emailSent };
}

export async function login(input: LoginInput, context: { ip?: string; userAgent?: string; requestId?: string }) {
  const identifier = input.email.includes("@")?normalizeEmail(input.email):input.email.trim();
  const emailHash = hashIdentifier(identifier);
  const ipHash = context.ip ? hashIdentifier(context.ip) : undefined;
  const since = new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60_000);
  const failedAttempts = await countRecentFailedAttempts(emailHash, ipHash, since);
  const user = await findUserByLogin(identifier);
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
      throw new AppError("EMAIL_NOT_VERIFIED", "Verify your email before signing in. You can request a new code from the verification page.", 403);
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

export async function resendEmailVerification(input: EmailInput, context: { ip?: string } = {}) {
  if (context.ip) await enforceRateLimit({ action: "auth.verification-resend.ip", identifier: context.ip, maximum: env.PASSWORD_RESET_IP_MAX_ATTEMPTS, windowSeconds: 60 * 60 });
  const user = await findUserByEmail(normalizeEmail(input.email));
  if (!user || user.status !== "PENDING_VERIFICATION") return { accepted: true, retryAfterSeconds: env.EMAIL_VERIFICATION_RESEND_SECONDS };
  const state = await getEmailVerificationSendState(user.id);
  const ageSeconds = state.lastCreatedAt ? Math.floor((Date.now() - new Date(state.lastCreatedAt).getTime()) / 1000) : Number.POSITIVE_INFINITY;
  if (ageSeconds < env.EMAIL_VERIFICATION_RESEND_SECONDS) return { accepted: true, retryAfterSeconds: env.EMAIL_VERIFICATION_RESEND_SECONDS - ageSeconds };
  if (state.sendsLastHour >= env.EMAIL_VERIFICATION_MAX_SENDS_PER_HOUR) return { accepted: true, retryAfterSeconds: 3600 };
  const { code, tokenHash } = createEmailVerificationOtp(user.email);
  await replaceVerificationToken({ userId: user.id, purpose: TOKEN_PURPOSE.EMAIL_VERIFICATION, tokenHash, expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_OTP_TTL_MINUTES * 60_000) });
  await authNotifier.sendEmailVerification({ to: user.email, name: user.name, code, deliveryId: tokenHash.slice(0, 24) });
  return { accepted: true, retryAfterSeconds: env.EMAIL_VERIFICATION_RESEND_SECONDS };
}

export async function verifyEmail(input: { email: string; code: string }, context: { ip?: string } = {}) {
  const email = normalizeEmail(input.email);
  if (context.ip) await enforceRateLimit({ action: "auth.email-verify.ip", identifier: context.ip, maximum: env.MFA_IP_MAX_ATTEMPTS, windowSeconds: env.LOGIN_WINDOW_MINUTES * 60 });
  if (!await consumeEmailVerificationOtp(email, hashEmailVerificationOtp(email, input.code), env.EMAIL_VERIFICATION_MAX_ATTEMPTS)) throw new AppError("INVALID_OR_EXPIRED_OTP", "That code is incorrect, expired or has reached its attempt limit. Request a new code if needed.", 400);
  return { verified: true };
}

export async function requestPasswordReset(input: EmailInput, context: { ip?: string } = {}) {
  const email = normalizeEmail(input.email);
  await enforceRateLimit({ action: "auth.password-reset.email", identifier: email, maximum: env.PASSWORD_RESET_EMAIL_MAX_ATTEMPTS, windowSeconds: 60 * 60 });
  if (context.ip) await enforceRateLimit({ action: "auth.password-reset.ip", identifier: context.ip, maximum: env.PASSWORD_RESET_IP_MAX_ATTEMPTS, windowSeconds: 60 * 60 });
  const user = await findUserByEmail(email);
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

export async function changePassword(userId:string,sessionId:string,input:{currentPassword:string;newPassword:string}){
  const user=await findUserById(userId);
  if(!user||!(await verifyPassword(user.passwordHash,input.currentPassword)))throw new AppError("INVALID_CURRENT_PASSWORD","Current password is incorrect.",400);
  await updatePassword(userId,await hashPassword(input.newPassword),sessionId);
  return{passwordChanged:true};
}
