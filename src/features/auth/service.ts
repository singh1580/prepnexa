import { AppError } from "@/lib/errors/app-error";
import { env } from "@/config/env";
import { createOpaqueToken, hashIdentifier, hashPassword, normalizeEmail, verifyPassword } from "./crypto";
import { createSession, createUser, findUserByEmail, recordLoginAttempt, revokeSession, touchLastLogin } from "./repository";
import type { LoginInput, RegisterInput } from "./validation";

const genericCredentialsError = () => new AppError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);

export async function register(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  if (await findUserByEmail(email)) throw new AppError("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
  return createUser({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password) });
}

export async function login(input: LoginInput, context: { ip?: string; userAgent?: string }) {
  const email = normalizeEmail(input.email);
  const emailHash = hashIdentifier(email);
  const ipHash = context.ip ? hashIdentifier(context.ip) : undefined;
  const user = await findUserByEmail(email);

  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    await recordLoginAttempt({ emailHash, ipHash, succeeded: false, failureReason: "INVALID_CREDENTIALS" });
    throw genericCredentialsError();
  }
  if (user.status !== "ACTIVE") {
    await recordLoginAttempt({ emailHash, ipHash, succeeded: false, failureReason: user.status });
    throw new AppError("ACCOUNT_NOT_ACTIVE", "This account is not active.", 403);
  }

  const { token, tokenHash } = createOpaqueToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  await createSession({ userId: user.id, tokenHash, ipHash, userAgent: context.userAgent?.slice(0, 1000), expiresAt });
  await Promise.all([touchLastLogin(user.id), recordLoginAttempt({ emailHash, ipHash, succeeded: true })]);
  return { token, expiresAt, user: { id: user.id, name: user.name, email: user.email } };
}

export async function logout(token: string | undefined) {
  if (token) await revokeSession(hashIdentifier(token));
}
