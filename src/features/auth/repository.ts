import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { loginAttempts, sessions, users } from "@/db/schema";

export function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function createUser(input: { name: string; email: string; passwordHash: string }) {
  const [user] = await db.insert(users).values(input).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    status: users.status,
  });
  return user;
}

export async function touchLastLogin(userId: string) {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function createSession(input: typeof sessions.$inferInsert) {
  await db.insert(sessions).values(input);
}

export function findActiveSession(tokenHash: string) {
  return db.select({
    sessionId: sessions.id,
    expiresAt: sessions.expiresAt,
    userId: users.id,
    userName: users.name,
    userEmail: users.email,
    userStatus: users.status,
  }).from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(
    and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())),
  ).limit(1).then((rows) => rows[0]);
}

export async function revokeSession(tokenHash: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)));
}

export async function recordLoginAttempt(input: typeof loginAttempts.$inferInsert) {
  await db.insert(loginAttempts).values(input);
}
