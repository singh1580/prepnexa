import { randomUUID } from "node:crypto";
import { and, count, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { loginAttempts, permissions, rolePermissions, roles, sessions, userRoles, users, verificationTokens } from "@/db/schema";
import type { TokenPurpose } from "./constants";

export function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function createUserWithVerification(input: { name: string; email: string; passwordHash: string; tokenHash: string; expiresAt: Date }) {
  const role = await db.query.roles.findFirst({ where: eq(roles.key, "STUDENT"), columns: { id: true } });
  if (!role) throw new Error("STUDENT role is not seeded");
  const userId = randomUUID();
  await db.batch([
    db.insert(users).values({ id: userId, name: input.name, email: input.email, passwordHash: input.passwordHash }),
    db.insert(verificationTokens).values({ userId, purpose: "EMAIL_VERIFICATION", tokenHash: input.tokenHash, expiresAt: input.expiresAt }),
    db.insert(userRoles).values({ userId, roleId: role.id }),
  ]);
  return { id: userId, name: input.name, email: input.email, status: "PENDING_VERIFICATION" as const };
}

export async function replaceVerificationToken(input: { userId: string; purpose: TokenPurpose; tokenHash: string; expiresAt: Date }) {
  const now = new Date();
  await db.batch([
    db.update(verificationTokens).set({ consumedAt: now }).where(and(eq(verificationTokens.userId, input.userId), eq(verificationTokens.purpose, input.purpose), isNull(verificationTokens.consumedAt))),
    db.insert(verificationTokens).values(input),
  ]);
}

export async function consumeEmailVerification(tokenHash: string) {
  const result = await db.execute<{ user_id: string }>(sql`
    with consumed as (
      update ${verificationTokens}
      set ${verificationTokens.consumedAt} = now()
      where ${verificationTokens.tokenHash} = ${tokenHash}
        and ${verificationTokens.purpose} = 'EMAIL_VERIFICATION'
        and ${verificationTokens.consumedAt} is null
        and ${verificationTokens.expiresAt} > now()
      returning ${verificationTokens.userId}
    )
    update ${users}
    set ${users.status} = 'ACTIVE', ${users.emailVerifiedAt} = now(), ${users.updatedAt} = now()
    where ${users.id} in (select user_id from consumed)
    returning ${users.id} as user_id
  `);
  return result.rows[0]?.user_id;
}

export async function consumePasswordReset(tokenHash: string, passwordHash: string) {
  const result = await db.execute<{ user_id: string }>(sql`
    with consumed as (
      update ${verificationTokens}
      set ${verificationTokens.consumedAt} = now()
      where ${verificationTokens.tokenHash} = ${tokenHash}
        and ${verificationTokens.purpose} = 'PASSWORD_RESET'
        and ${verificationTokens.consumedAt} is null
        and ${verificationTokens.expiresAt} > now()
      returning ${verificationTokens.userId}
    ), updated_user as (
      update ${users}
      set ${users.passwordHash} = ${passwordHash}, ${users.updatedAt} = now()
      where ${users.id} in (select user_id from consumed)
      returning ${users.id}
    ), revoked_sessions as (
      update ${sessions}
      set ${sessions.revokedAt} = now()
      where ${sessions.userId} in (select id from updated_user) and ${sessions.revokedAt} is null
    )
    select id as user_id from updated_user
  `);
  return result.rows[0]?.user_id;
}

export async function touchLastLogin(userId: string) {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function createSession(input: typeof sessions.$inferInsert) {
  await db.insert(sessions).values(input);
}

export function findActiveSession(tokenHash: string) {
  return db.select({
    sessionId: sessions.id, expiresAt: sessions.expiresAt,
    userId: users.id, userName: users.name, userEmail: users.email, userStatus: users.status,
  }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(
    and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())),
  ).limit(1).then((rows) => rows[0]);
}

export async function findAuthorizationForUser(userId: string) {
  return db.select({ role: roles.key, permission: permissions.key })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));
}

export async function revokeSession(tokenHash: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)));
}

export async function recordLoginAttempt(input: typeof loginAttempts.$inferInsert) {
  await db.insert(loginAttempts).values(input);
}

export async function countRecentFailedAttempts(emailHash: string, ipHash: string | undefined, since: Date) {
  const [emailRows, ipRows] = await Promise.all([
    db.select({ value: count() }).from(loginAttempts).where(and(eq(loginAttempts.succeeded, false), gte(loginAttempts.createdAt, since), eq(loginAttempts.emailHash, emailHash))),
    ipHash ? db.select({ value: count() }).from(loginAttempts).where(and(eq(loginAttempts.succeeded, false), gte(loginAttempts.createdAt, since), eq(loginAttempts.ipHash, ipHash))) : Promise.resolve([{ value: 0 }]),
  ]);
  return { email: emailRows[0]?.value ?? 0, ip: ipRows[0]?.value ?? 0 };
}
