import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const run = process.env.RUN_INTEGRATION_TESTS === "true";
const actorId = randomUUID();
const slug = `integration-${randomUUID()}`;
let examId: string | undefined;

describe.skipIf(!run)("admin content database flow", () => {
  afterAll(async () => {
    const [{ eq }, { db }, { auditLogs, exams, users }] = await Promise.all([import("drizzle-orm"), import("../../src/db/client"), import("../../src/db/schema")]);
    await db.delete(auditLogs).where(eq(auditLogs.actorUserId, actorId));
    if (examId) await db.delete(exams).where(eq(exams.id, examId));
    await db.delete(users).where(eq(users.id, actorId));
  }, 30_000);

  it("creates and edits an audited exam taxonomy", async () => {
    const [{ eq }, { db }, { auditLogs, users }, service] = await Promise.all([import("drizzle-orm"), import("../../src/db/client"), import("../../src/db/schema"), import("../../src/features/admin-content/service")]);
    await db.insert(users).values({ id: actorId, email: `${slug}@example.com`, name: "Content Integration", passwordHash: "integration-only", status: "ACTIVE", emailVerifiedAt: new Date() });
    const actor = { userId: actorId, requestId: randomUUID() };
    examId = (await service.createExam({ name: "Integration Exam", slug, description: "Initial" }, actor)).id;
    const subjectId = (await service.createSubject(examId, { name: "Aptitude", sortOrder: 0 }, actor)).id;
    const topicId = (await service.createTopic(subjectId, { name: "Percentages", sortOrder: 0 }, actor)).id;
    await service.updateTopic(topicId, { name: "Percentage problems", sortOrder: 1 }, actor);

    const exam = await service.getManagedExam(examId);
    expect(exam.subjects[0]?.topics[0]).toMatchObject({ id: topicId, name: "Percentage problems", sortOrder: 1 });
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.actorUserId, actorId));
    expect(logs.map((entry) => entry.action)).toEqual(expect.arrayContaining(["exam.created", "subject.created", "topic.created", "topic.updated"]));
  }, 30_000);
});
