import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

describe.skipIf(process.env.RUN_ATTEMPT_INTEGRATION !== "true")("student attempt execution", () => {
  it("starts once, snapshots safely, resumes, autosaves with versions, and locks on submit", async () => {
    const [{ db }, schema, { eq }, service] = await Promise.all([
      import("../../src/db/client"), import("../../src/db/schema"), import("drizzle-orm"), import("../../src/features/student-tests/service"),
    ]);
    const userId = randomUUID(), examId = randomUUID(), subjectId = randomUUID(), topicId = randomUUID();
    const questionId = randomUUID(), revisionId = randomUUID(), testId = randomUUID(), secondTestId = randomUUID();
    const sectionId = randomUUID(), secondSectionId = randomUUID(), productId = randomUUID();
    const requestId = randomUUID();
    try {
      await db.batch([
        db.insert(schema.users).values({ id: userId, email: `attempt-${userId}@example.com`, name: "Attempt QA", passwordHash: "test-only", status: "ACTIVE", emailVerifiedAt: new Date() }),
        db.insert(schema.exams).values({ id: examId, slug: examId, name: "Attempt QA Exam", status: "PUBLISHED", createdBy: userId }),
        db.insert(schema.subjects).values({ id: subjectId, examId, name: "Aptitude", sortOrder: 0 }),
        db.insert(schema.topics).values({ id: topicId, subjectId, name: "Percentages", sortOrder: 0 }),
        db.insert(schema.questions).values({ id: questionId, topicId, type: "SINGLE_CHOICE", stem: "Current mutable stem", marks: "1", negativeMarks: "0", difficulty: "EASY", status: "PUBLISHED", createdBy: userId, publishedAt: new Date() }),
        db.insert(schema.questionRevisions).values({ id: revisionId, questionId, version: 1, stem: "What is fifty percent of ten?", explanation: "Five is half of ten.", marks: "1", negativeMarks: "0", answerConfig: { correctKeys: ["B"] }, createdBy: userId, publishedAt: new Date() }),
        db.insert(schema.questionRevisionOptions).values([
          { revisionId, stableKey: "A", body: "4", isCorrect: false, sortOrder: 0 },
          { revisionId, stableKey: "B", body: "5", isCorrect: true, sortOrder: 1 },
        ]),
        db.insert(schema.tests).values([
          { id: testId, examId, title: "Attempt QA Paper", mode: "MOCK", category: "TOPIC_SET", durationMinutes: 30, maxAttempts: 1, status: "PUBLISHED" },
          { id: secondTestId, examId, title: "Second QA Paper", mode: "MOCK", category: "TOPIC_SET", durationMinutes: 30, maxAttempts: 1, status: "PUBLISHED" },
        ]),
        db.insert(schema.testSections).values([
          { id: sectionId, testId, title: "Questions", sortOrder: 0 },
          { id: secondSectionId, testId: secondTestId, title: "Questions", sortOrder: 0 },
        ]),
        db.insert(schema.testQuestions).values([
          { testId, sectionId, questionId, sortOrder: 0 },
          { testId: secondTestId, sectionId: secondSectionId, questionId, sortOrder: 0 },
        ]),
        db.insert(schema.products).values({ id: productId, slug: productId, name: "Attempt QA Free", pricePaise: 0, accessDays: 30, status: "PUBLISHED" }),
        db.insert(schema.productTests).values([{ productId, testId }, { productId, testId: secondTestId }]),
      ]);

      const started = await service.startOrResumeAttempt(testId, { userId, requestId });
      expect(started.resumed).toBe(false);
      expect(await service.startOrResumeAttempt(testId, { userId, requestId })).toEqual({ id: started.id, resumed: true });
      const attempt = await service.getAttempt(started.id, userId);
      expect(attempt.status).toBe("IN_PROGRESS");
      expect(attempt.questions).toHaveLength(1);
      expect(attempt.questions[0]).toMatchObject({ stem: "What is fifty percent of ten?", type: "SINGLE_CHOICE" });
      expect(attempt.questions[0]).not.toHaveProperty("explanation");
      expect(attempt.questions[0].options[0]).not.toHaveProperty("isCorrect");
      await expect(service.startOrResumeAttempt(secondTestId, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CONFLICT", status: 409 });

      const selectedOptionIds = [attempt.questions[0].options[0].id];
      expect(await service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: true, version: 0 }, { userId, requestId })).toMatchObject({ version: 1 });
      await expect(service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: false, version: 0 }, { userId, requestId })).rejects.toMatchObject({ code: "STALE_ANSWER", status: 409 });
      await expect(service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds: [randomUUID()], textAnswer: null, numericAnswer: null, markedForReview: false, version: 1 }, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CONFLICT", status: 409 });

      expect(await service.submitAttempt(started.id, { userId, requestId })).toMatchObject({ id: started.id, status: "SUBMITTED" });
      await expect(service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: false, version: 1 }, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CLOSED", status: 409 });
      await expect(service.startOrResumeAttempt(testId, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CONFLICT", status: 409 });
    } finally {
      await db.batch([
        db.delete(schema.attempts).where(eq(schema.attempts.userId, userId)),
        db.delete(schema.products).where(eq(schema.products.id, productId)),
        db.delete(schema.tests).where(eq(schema.tests.examId, examId)),
        db.delete(schema.questions).where(eq(schema.questions.id, questionId)),
        db.delete(schema.exams).where(eq(schema.exams.id, examId)),
        db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, userId)),
        db.delete(schema.users).where(eq(schema.users.id, userId)),
      ]);
    }
  }, Number(process.env.INTEGRATION_TIMEOUT_MS ?? 480_000));
});
