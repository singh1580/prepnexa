import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

describe.skipIf(process.env.RUN_ATTEMPT_INTEGRATION !== "true")("student attempt execution", () => {
  it("starts once, snapshots safely, resumes, autosaves with versions, and locks on submit", async () => {
    const [{ db }, schema, { eq }, service, resultsService] = await Promise.all([
      import("../../src/db/client"), import("../../src/db/schema"), import("drizzle-orm"), import("../../src/features/student-tests/service"), import("../../src/features/student-results/service"),
    ]);
    const userId = randomUUID();
    const questionId = randomUUID(), revisionId = randomUUID(), testId = randomUUID(), secondTestId = randomUUID();
    const sectionId = randomUUID(), secondSectionId = randomUUID(), productId = randomUUID(), secondProductId = randomUUID();
    const requestId = randomUUID();
    try {
      await db.batch([
        db.insert(schema.users).values({ id: userId, email: `attempt-${userId}@example.com`, name: "Attempt QA", passwordHash: "test-only", status: "ACTIVE", emailVerifiedAt: new Date() }),
        db.insert(schema.questions).values({ id: questionId, type: "SINGLE_CHOICE", stem: "Current mutable stem", marks: "1", negativeMarks: "0", difficulty: "EASY", createdBy: userId }),
        db.insert(schema.questionRevisions).values({ id: revisionId, questionId, version: 1, stem: "What is fifty percent of ten?", explanation: "Five is half of ten.", marks: "1", negativeMarks: "0", answerConfig: { correctKeys: ["B"] }, createdBy: userId }),
        db.insert(schema.questionRevisionOptions).values([
          { revisionId, stableKey: "A", body: "4", isCorrect: false, sortOrder: 0 },
          { revisionId, stableKey: "B", body: "5", isCorrect: true, sortOrder: 1 },
        ]),
        db.insert(schema.tests).values([
          { id: testId, title: "Attempt QA Paper", mode: "MOCK", category: "TOPIC_SET", durationMinutes: 30, maxAttempts: 1 },
          { id: secondTestId, title: "Second QA Paper", mode: "MOCK", category: "TOPIC_SET", durationMinutes: 30, maxAttempts: 1 },
        ]),
        db.insert(schema.testSections).values([
          { id: sectionId, testId, title: "Questions", sortOrder: 0 },
          { id: secondSectionId, testId: secondTestId, title: "Questions", sortOrder: 0 },
        ]),
        db.insert(schema.testQuestions).values([
          { testId, sectionId, questionId, sortOrder: 0 },
          { testId: secondTestId, sectionId: secondSectionId, questionId, sortOrder: 0 },
        ]),
        db.insert(schema.products).values([
          { id: productId, slug: productId, name: "Attempt QA Free", pricePaise: 0, accessDays: 30, isLive: true },
          { id: secondProductId, slug: secondProductId, name: "Attempt QA Second Package", pricePaise: 0, accessDays: 30, isLive: true },
        ]),
        db.insert(schema.productTests).values([{ productId, testId }, { productId, testId: secondTestId }, { productId: secondProductId, testId }]),
      ]);

      const started = await service.startOrResumeAttempt(testId, productId, { userId, requestId });
      expect(started.resumed).toBe(false);
      expect(await service.startOrResumeAttempt(testId, productId, { userId, requestId })).toEqual({ id: started.id, resumed: true });
      const attempt = await service.getAttempt(started.id, userId);
      expect(attempt.status).toBe("IN_PROGRESS");
      expect(attempt.questions).toHaveLength(1);
      expect(attempt.questions[0]).toMatchObject({ stem: "What is fifty percent of ten?", type: "SINGLE_CHOICE" });
      expect(attempt.questions[0]).not.toHaveProperty("explanation");
      expect(attempt.questions[0].options[0]).not.toHaveProperty("isCorrect");
      await expect(service.startOrResumeAttempt(secondTestId, productId, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CONFLICT", status: 409 });

      const correctOption = attempt.questions[0].options.find(option => option.body === "5");
      expect(correctOption).toBeDefined();
      const selectedOptionIds = [correctOption!.id];
      expect(await service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: true, timeSpentSeconds: 12, version: 0 }, { userId, requestId })).toMatchObject({ version: 1 });
      expect(await service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: false, timeSpentSeconds: 18, version: 1 }, { userId, requestId })).toMatchObject({ version: 2 });
      await expect(service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: false, timeSpentSeconds: 12, version: 0 }, { userId, requestId })).rejects.toMatchObject({ code: "STALE_ANSWER", status: 409 });
      await expect(service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds: [randomUUID()], textAnswer: null, numericAnswer: null, markedForReview: false, timeSpentSeconds: 12, version: 2 }, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CONFLICT", status: 409 });

      const submitted = await service.submitAttempt(started.id, { userId, requestId });
      expect(submitted).toMatchObject({ id: started.id, status: "SUBMITTED", resultId: expect.any(String) });
      const result = await resultsService.getStudentResult(submitted.resultId, userId);
      expect(result).toMatchObject({ score: "1.00", maxScore: "1.00", correctCount: 1, incorrectCount: 0, unansweredCount: 0 });
      expect(result.questions[0]).toMatchObject({ isCorrect: true, awardedMarks: "1.00", explanation: "Five is half of ten." });
      expect((result.questions[0].options as { isCorrect: boolean }[]).some(option => option.isCorrect)).toBe(true);
      await expect(service.saveAttemptAnswer(started.id, attempt.questions[0].id, { selectedOptionIds, textAnswer: null, numericAnswer: null, markedForReview: false, timeSpentSeconds: 12, version: 2 }, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CLOSED", status: 409 });
      await expect(service.startOrResumeAttempt(testId, productId, { userId, requestId })).rejects.toMatchObject({ code: "ATTEMPT_CONFLICT", status: 409 });
      const sameTestInSecondPackage = await service.startOrResumeAttempt(testId, secondProductId, { userId, requestId });
      expect(sameTestInSecondPackage).toMatchObject({ id: expect.any(String), resumed: false });
      expect(sameTestInSecondPackage.id).not.toBe(started.id);
    } finally {
      await db.batch([
        db.delete(schema.attempts).where(eq(schema.attempts.userId, userId)),
        db.delete(schema.products).where(eq(schema.products.id, productId)),
        db.delete(schema.products).where(eq(schema.products.id, secondProductId)),
        db.delete(schema.tests).where(eq(schema.tests.id, testId)),
        db.delete(schema.tests).where(eq(schema.tests.id, secondTestId)),
        db.delete(schema.questions).where(eq(schema.questions.id, questionId)),
        db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, userId)),
        db.delete(schema.users).where(eq(schema.users.id, userId)),
      ]);
    }
  }, Number(process.env.INTEGRATION_TIMEOUT_MS ?? 480_000));
});
