import { afterAll, describe, expect, it } from "vitest";

const run = process.env.RUN_INTEGRATION_TESTS === "true";
const email = `auth-${crypto.randomUUID()}@example.com`;
let userId: string | undefined;

describe.skipIf(!run)("auth database flow", () => {
  afterAll(async () => {
    if (userId) {
      const [{ eq }, { db }, { users }] = await Promise.all([import("drizzle-orm"), import("../../src/db/client"), import("../../src/db/schema")]);
      await db.delete(users).where(eq(users.id, userId));
    }
  }, 30_000);

  it("verifies email, resolves RBAC, resets password, and revokes sessions", async () => {
    const [{ db }, { sessions }, cryptoModule, { TOKEN_PURPOSE }, repository] = await Promise.all([
      import("../../src/db/client"), import("../../src/db/schema"), import("../../src/features/auth/crypto"),
      import("../../src/features/auth/constants"), import("../../src/features/auth/repository"),
    ]);
    const { createOpaqueToken, hashIdentifier, hashPassword } = cryptoModule;
    const { consumeEmailVerification, consumePasswordReset, createUserWithVerification, findActiveSession, findAuthorizationForUser, replaceVerificationToken } = repository;
    const verification = createOpaqueToken();
    const user = await createUserWithVerification({ name: "Integration Learner", email, passwordHash: await hashPassword("initial-password"), tokenHash: verification.tokenHash, expiresAt: new Date(Date.now() + 60_000) });
    userId = user.id;
    expect(await consumeEmailVerification(hashIdentifier(verification.token))).toBe(user.id);
    expect(await consumeEmailVerification(hashIdentifier(verification.token))).toBeUndefined();

    const grants = await findAuthorizationForUser(user.id);
    expect(grants.some((grant) => grant.role === "STUDENT" && grant.permission === "test.attempt")).toBe(true);

    const session = createOpaqueToken();
    await db.insert(sessions).values({ userId: user.id, tokenHash: session.tokenHash, expiresAt: new Date(Date.now() + 60_000) });
    expect((await findActiveSession(session.tokenHash))?.userId).toBe(user.id);

    const reset = createOpaqueToken();
    await replaceVerificationToken({ userId: user.id, purpose: TOKEN_PURPOSE.PASSWORD_RESET, tokenHash: reset.tokenHash, expiresAt: new Date(Date.now() + 60_000) });
    expect(await consumePasswordReset(hashIdentifier(reset.token), await hashPassword("replacement-password"))).toBe(user.id);
    expect(await findActiveSession(session.tokenHash)).toBeUndefined();
  }, 30_000);
});
