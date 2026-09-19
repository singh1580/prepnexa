import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const run = process.env.RUN_INTEGRATION_TESTS === "true";
const integrationTimeout = Number(process.env.INTEGRATION_TIMEOUT_MS ?? 30_000);
const actorId = randomUUID();
const reviewerId = randomUUID();
const slug = `integration-${randomUUID()}`;
let examId: string | undefined;
let questionId: string | undefined;
let testId: string | undefined;
let materialId: string | undefined;
let productId: string | undefined;

describe.skipIf(!run)("admin content database flow", () => {
  afterAll(async () => {
    const [{ eq, inArray }, { db }, { auditLogs, contentImportJobs, exams, materials, products, questions, tests, users }] = await Promise.all([import("drizzle-orm"), import("../../src/db/client"), import("../../src/db/schema")]);
    if (productId) await db.delete(products).where(inArray(products.id, [productId]));
    if (materialId) await db.delete(materials).where(inArray(materials.id, [materialId]));
    if (testId) await db.delete(tests).where(inArray(tests.id, [testId]));
    await db.delete(questions).where(eq(questions.createdBy, actorId));
    await db.delete(contentImportJobs).where(eq(contentImportJobs.requestedBy, actorId));
    if (examId) await db.delete(exams).where(eq(exams.id, examId));
    // Delete audit records last so a timed-out mutation cannot recreate a user reference
    // after the first cleanup statement has already completed.
    await db.delete(auditLogs).where(inArray(auditLogs.actorUserId, [actorId, reviewerId]));
    await db.delete(users).where(inArray(users.id, [actorId, reviewerId]));
  }, integrationTimeout);

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
    await service.publishExam(examId, actor);
    await service.updateTopic(topicId, { name: "Updated published taxonomy", sortOrder: 2 }, actor);
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.actorUserId, actorId));
    expect(logs.map((entry) => entry.action)).toEqual(expect.arrayContaining(["exam.created", "subject.created", "topic.created", "topic.updated"]));

    const importService = await import("../../src/features/admin-imports/service");
    const headers = "topicId,type,stem,explanation,marks,negativeMarks,difficulty,optionA,optionB,optionC,optionD,correctOptions,numericAnswer,numericTolerance,acceptedAnswers,caseSensitive";
    const imported = await importService.importQuestionsCsv(`${headers}\n${topicId},TEXT,Write the value of one half as a percentage,,1,0,EASY,,,,,,,,50 percent,false`, actor);
    expect(imported).toMatchObject({ status: "IMPORTED", importedRows: 1 });

    questionId = (await service.createQuestion({ topicId, type: "SINGLE_CHOICE", stem: "What percentage is one half?", explanation: "One half multiplied by 100 is 50 percent.", marks: 1, negativeMarks: 0.25, difficulty: "EASY", options: [{ stableKey: "A", body: "25%", isCorrect: false, sortOrder: 0 }, { stableKey: "B", body: "50%", isCorrect: true, sortOrder: 1 }], numericAnswer: null, numericTolerance: 0, acceptedAnswers: [], caseSensitive: false }, actor)).id;
    await service.publishQuestion(questionId, actor);
    expect(await service.getManagedQuestion(questionId)).toMatchObject({ status: "PUBLISHED", reviewedBy: null });

    const testService = await import("../../src/features/admin-tests/service");
    testId = (await testService.createTest({ examId, title: "Integration mock test", mode: "MOCK", durationMinutes: 60, instructions: "Integration only", maxAttempts: 1, shuffleQuestions: true, shuffleOptions: true }, actor)).id;
    const sectionId = (await testService.createSection(testId, { title: "Aptitude", durationMinutes: 60, sortOrder: 0 }, actor)).id;
    await testService.assignQuestion(sectionId, questionId, 0, actor);
    await testService.removeTestItem(sectionId, questionId, actor);
    expect((await testService.getManagedTest(testId)).sections[0]?.questions).toHaveLength(0);
    await expect(testService.publishTest(testId, actor)).rejects.toMatchObject({ status: 409 });
    await testService.assignQuestion(sectionId, questionId, 0, actor);
    const emptySection = (await testService.createSection(testId, { title: "Temporary", durationMinutes: null, sortOrder: 1 }, actor)).id;
    await expect(testService.publishTest(testId, actor)).rejects.toMatchObject({ status: 409 });
    await testService.removeTestItem(emptySection, null, actor);
    await testService.updateSection(sectionId, { title: "Edited section", durationMinutes: 60, sortOrder: 0 }, actor);
    await testService.reorderQuestions(sectionId, [questionId], actor);
    await testService.publishTest(testId, actor);
    await expect(testService.removeTestItem(sectionId, questionId, actor)).rejects.toMatchObject({ status: 409 });
    expect(await testService.getManagedTest(testId)).toMatchObject({ status: "PUBLISHED" });

    const catalogService = await import("../../src/features/admin-catalog/service");
    materialId = (await catalogService.createMaterial({ examId, title: "Integration article", type: "ARTICLE", body: "Integration content", privateObjectKey: "" }, actor)).id;
    await catalogService.updateMaterial(materialId, { examId, title: "Updated article", type: "ARTICLE", body: "Revised integration content", privateObjectKey: "" }, actor);
    await catalogService.publishMaterial(materialId, actor);
    productId = (await catalogService.createProduct({ name: "Integration package", slug: `package-${slug}`, description: "Integration only", pricePaise: 100, accessDays: 30 }, actor)).id;
    await catalogService.updateProduct(productId, { name: "Edited package", slug: `package-${slug}`, description: "Edited", pricePaise: 200, accessDays: 90 }, actor);
    await catalogService.linkProduct(productId, "TEST", testId, actor);
    await catalogService.unlinkProduct(productId, "TEST", testId, actor);
    await catalogService.linkProduct(productId, "TEST", testId, actor);
    await catalogService.linkProduct(productId, "MATERIAL", materialId, actor);
    await catalogService.publishProduct(productId, actor);
    expect(await catalogService.getProduct(productId)).toMatchObject({ status: "PUBLISHED" });

    await expect(testService.archiveTest(testId, actor)).rejects.toMatchObject({ status: 409 });
    await expect(catalogService.archiveCatalog(materialId, "material", actor)).rejects.toMatchObject({ status: 409 });
    await expect(service.archiveQuestion(questionId, actor)).rejects.toMatchObject({ code: "INVALID_CONTENT_STATE", status: 409 });
    await expect(service.archiveExam(examId, actor)).rejects.toMatchObject({ code: "INVALID_CONTENT_STATE", status: 409 });
  }, integrationTimeout * 2);
});
