import { AppError } from "@/lib/errors/app-error";
import { env } from "@/config/env";
import { ADMIN_ROLE_KEYS } from "./constants";
import { hashIdentifier } from "./crypto";
import { findActiveTotpFactor, findRoleKeysForUser, findValidMfaChallenge } from "./repository";
import { enforceRateLimit } from "./rate-limit";

// A password-verified challenge permits initial setup only, never a session.
export async function requireEnrollmentChallenge(token: string) {
  const challenge = await findValidMfaChallenge(hashIdentifier(token));
  if (!challenge || challenge.status !== "ACTIVE") throw new AppError("INVALID_MFA_CHALLENGE", "Your setup session expired. Sign in again.", 401);
  const roles = await findRoleKeysForUser(challenge.userId);
  if (!roles.some(role => ADMIN_ROLE_KEYS.has(role)) || await findActiveTotpFactor(challenge.userId)) throw new AppError("FORBIDDEN", "Initial setup is not available for this account. Sign in again.", 403);
  return { id: challenge.userId, email: challenge.email };
}
export async function limitMfaAttempt(email: string, ip?: string) {
  await enforceRateLimit({ action: "auth.mfa-enrollment.email", identifier: email, maximum: env.MFA_MAX_ATTEMPTS, windowSeconds: env.LOGIN_WINDOW_MINUTES * 60, message: "Too many verification attempts. Please try again later." });
  if (ip) await enforceRateLimit({ action: "auth.mfa-enrollment.ip", identifier: ip, maximum: env.MFA_IP_MAX_ATTEMPTS, windowSeconds: env.LOGIN_WINDOW_MINUTES * 60, message: "Too many verification attempts. Please try again later." });
}

