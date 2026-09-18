import { AppError } from "@/lib/errors/app-error";
import { env } from "@/config/env";
import { ADMIN_ROLE_KEYS } from "./constants";
import { hashIdentifier } from "./crypto";
import { countRecentFailedAttempts, findActiveTotpFactor, findRoleKeysForUser, findValidMfaChallenge, recordLoginAttempt } from "./repository";

// A password-verified challenge permits initial setup only, never a session.
export async function requireEnrollmentChallenge(token: string) {
  const challenge = await findValidMfaChallenge(hashIdentifier(token));
  if (!challenge || challenge.status !== "ACTIVE") throw new AppError("INVALID_MFA_CHALLENGE", "Your setup session expired. Sign in again.", 401);
  const roles = await findRoleKeysForUser(challenge.userId);
  if (!roles.some(role => ADMIN_ROLE_KEYS.has(role)) || await findActiveTotpFactor(challenge.userId)) throw new AppError("FORBIDDEN", "Initial setup is not available for this account. Sign in again.", 403);
  return { id: challenge.userId, email: challenge.email };
}
export async function limitMfaAttempt(email: string) {
  const emailHash = hashIdentifier(email);
  const attempts = await countRecentFailedAttempts(emailHash, undefined, new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60_000));
  if (attempts.email >= env.LOGIN_MAX_ATTEMPTS) throw new AppError("TOO_MANY_LOGIN_ATTEMPTS", "Too many verification attempts. Please try again later.", 429);
  await recordLoginAttempt({ emailHash, succeeded: false, failureReason: "MFA_ATTEMPT" });
}

