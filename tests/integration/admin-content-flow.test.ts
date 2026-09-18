import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const run = process.env.RUN_INTEGRATION_TESTS === "true";
const actorId = randomUUID();
const reviewerId = randomUUID();
const slug = `integration-${randomUUID()}`;
let examId: string | undefined;
let questionId: string | undefined;

describe.skipIf(!run)("admin content database flow", () => {
  afterAll(async () => {
    const [{ eq, inArray }, { db }, { auditLogs, exams, questions, users }] = await Promise.all([import("drizzle-orm"), import("../../src/db/client"), import("../../src/db/schema")]);
    await db.delete(auditLogs).where(inArray(auditLogs.actorUserId, [actorId, reviewerId]));
    if (questionId) await db.delete(questions).where(inArray(questions.id, [questionId]));
    if (examId) await db.delete(exams).where(eq(exams.id, examId));
    await db.delete(users).where(inArray(users.id, [actorId, reviewerId]));
  }, 30_000);

  it("creates and edits an audited exam taxonomy", async () => {
    const [{ eq }, { db }, { auditLogs, users }, service] = await Promise.all([import("drizzle-orm"), import("../../src/db/client"), import("../../src/db/schema"), import("../../src/features/admin-content/service")]);
    await db.insert(users).values([{ id: actorId, email: `${slug}@example.com`, name: "Content Integration", passwordHash: "integration-only", status: "ACTIVE", emailVerifiedAt: new Date() }, { id: reviewerId, email: `reviewer-${slug}@example.com`, name: "Review Integration", passwordHash: "integration-only", status: "ACTIVE", emailVerifiedAt: new Date() }]);
    const actor = { userId: actorId, requestId: randomUUID() };
    examId = (await service.createExam({ name: "Integration Exam", slug, description: "Initial" }, actor)).id;
    const subjectId = (await service.createSubject(examId, { name: "Aptitude", sortOrder: 0 }, actor)).id;
    const topicId = (await service.createTopic(subjectId, { name: "Percentages", sortOrder: 0 }, actor)).id;
    await service.updateTopic(topicId, { name: "Percentage problems", sortOrder: 1 }, actor);

    const exam = await service.getManagedExam(examId);
    expect(exam.subjects[0]?.topics[0]).toMatchObject({ id: topicId, name: "Percentage problems", sortOrder: 1 });
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.actorUserId, actorId));
    expect(logs.map((entry) => entry.action)).toEqual(expect.arrayContaining(["exam.created", "subject.created", "topic.created", "topic.updated"]));

    questionId = (await service.createQuestion({ topicId, type: "SINGLE_CHOICE", stem: "What percentage is one half?", explanation: "One half multiplied by 100 is 50 percent.", marks: 1, negativeMarks: 0.25, difficulty: "EASY", options: [{ stableKey: "A", body: "25%", isCorrect: false, sortOrder: 0 }, { stableKey: "B", body: "50%", isCorrect: true, sortOrder: 1 }], numericAnswer: null, numericTolerance: 0, acceptedAnswers: [], caseSensitive: false }, actor)).id;
    await service.submitQuestion(questionId, actor);
    await expect(service.reviewQuestion(questionId, "APPROVE", actor)).rejects.toMatchObject({ code: "REVIEWER_SEPARATION_REQUIRED", status: 403 });
    await service.reviewQuestion(questionId, "APPROVE", { userId: reviewerId, requestId: randomUUID() });
    await service.publishQuestion(questionId, actor);
    expect(await service.getManagedQuestion(questionId)).toMatchObject({ status: "PUBLISHED", reviewedBy: reviewerId });
    await service.archiveQuestion(questionId, actor);
    expect(await service.getManagedQuestion(questionId)).toMatchObject({ status: "ARCHIVED", reviewedBy: reviewerId });
  }, 30_000);
});
