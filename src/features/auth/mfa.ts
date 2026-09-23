import * as OTPAuth from "otpauth";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors/app-error";
import { createOpaqueToken, createRecoveryCodes, decryptMfaSecret, encryptMfaSecret, hashIdentifier, hashRecoveryCode } from "./crypto";
import { confirmTotpFactor, consumeMfaChallenge, consumeRecoveryCode, consumeTotpStep, createSession, findActiveTotpFactor, findValidMfaChallenge, recordLoginAttempt, replacePendingTotpFactor, touchLastLogin } from "./repository";
import type { MfaLoginInput } from "./validation";

function authenticator(secret: string, email: string) {
  return new OTPAuth.TOTP({ issuer: env.NEXT_PUBLIC_APP_NAME, label: email, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
}

function validateTotp(secret: string, email: string, code: string) {
  return authenticator(secret, email).validate({ token: code, window: 1 });
}

export async function setupMfa(user: { id: string; email: string }) {
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  await replacePendingTotpFactor(user.id, encryptMfaSecret(secret));
  return { secret, uri: authenticator(secret, user.email).toString() };
}

export async function confirmMfa(user: { id: string; email: string }, code: string) {
  const factor = await findActiveTotpFactor(user.id, false);
  if (!factor || factor.verifiedAt) throw new AppError("MFA_SETUP_NOT_FOUND", "Start two-factor setup again.", 400);
  if (validateTotp(decryptMfaSecret(factor.secretCiphertext), user.email, code) === null) throw new AppError("INVALID_MFA_CODE", "The authenticator code is invalid.", 400);
  const recoveryCodes = createRecoveryCodes();
  if (!await confirmTotpFactor(user.id, factor.id, recoveryCodes.map(hashRecoveryCode))) throw new AppError("MFA_SETUP_NOT_FOUND", "Start two-factor setup again.", 400);
  return { enabled: true, recoveryCodes };
}

export async function verifyMfaLogin(input: MfaLoginInput, context: { ip?: string; userAgent?: string }) {
  const challengeHash = hashIdentifier(input.challengeToken);
  const challenge = await findValidMfaChallenge(challengeHash);
  if (!challenge || challenge.status !== "ACTIVE") throw new AppError("INVALID_MFA_CHALLENGE", "The login challenge is invalid or expired.", 401);
  const factor = await findActiveTotpFactor(challenge.userId);
  if (!factor) throw new AppError("MFA_SETUP_REQUIRED", "Two-factor authentication must be configured for this account.", 403);

  let totpStep: number | undefined;
  if (input.code) {
    const delta = validateTotp(decryptMfaSecret(factor.secretCiphertext), challenge.email, input.code);
    if (delta === null) throw new AppError("INVALID_MFA_CODE", "The authenticator code is invalid.", 401);
    totpStep = Math.floor(Date.now() / 30_000) + delta;
  } else if (!input.recoveryCode || !await consumeRecoveryCode(challenge.userId, hashRecoveryCode(input.recoveryCode))) {
    throw new AppError("INVALID_RECOVERY_CODE", "The recovery code is invalid or already used.", 401);
  }

  if (!await consumeMfaChallenge(challengeHash, challenge.userId)) throw new AppError("INVALID_MFA_CHALLENGE", "The login challenge is invalid or expired.", 401);
  if (totpStep !== undefined && !await consumeTotpStep(factor.id, totpStep)) throw new AppError("MFA_CODE_REPLAYED", "This authenticator code has already been used.", 401);

  const { token, tokenHash } = createOpaqueToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  const ipHash = context.ip ? hashIdentifier(context.ip) : undefined;
  await createSession({ userId: challenge.userId, tokenHash, ipHash, userAgent: context.userAgent?.slice(0, 1000), expiresAt }, env.MAX_ACTIVE_SESSIONS);
  await Promise.all([touchLastLogin(challenge.userId), recordLoginAttempt({ emailHash: hashIdentifier(challenge.email), ipHash, succeeded: true })]);
  return { token, expiresAt, user: { id: challenge.userId, name: challenge.name, email: challenge.email } };
}
