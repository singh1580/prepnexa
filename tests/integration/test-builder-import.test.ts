import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

// Explicitly opt in with the isolated acceptance database; never uses production.
describe.skipIf(process.env.RUN_BUILDER_INTEGRATION !== "true")("test-centred question creation", () => {
  it("rejects invalid/cross-exam imports, attaches ordered questions and publishes together", async () => {
    const [{ db }, schema, { eq, sql }, importer, repository, { testQuestionCsvTemplate }] = await Promise.all([
      import("../../src/db/client"), import("../../src/db/schema"), import("drizzle-orm"),
      import("../../src/features/admin-tests/question-import"), import("../../src/features/admin-tests/repository"),
      import("../../src/features/admin-imports/question-csv"),
    ]);
    const actor = { userId: randomUUID(), requestId: randomUUID() };
    const examId = randomUUID(), otherExamId = randomUUID(), subjectId = randomUUID(), topicId = randomUUID();
    const materialId = randomUUID();
    const copiedTestIds: string[] = [];
    const productIds: string[] = [];
    const testId = randomUUID(), sectionId = randomUUID(), otherTestId = randomUUID(), otherSectionId = randomUUID();
    try {
      await db.batch([
        db.insert(schema.users).values({ id: actor.userId, email: `builder-${actor.userId}@example.com`, name: "Builder QA", passwordHash: "test-only", status: "ACTIVE" }),
        db.insert(schema.exams).values([{ id: examId, slug: examId, name: "Builder QA", createdBy: actor.userId }, { id: otherExamId, slug: otherExamId, name: "Other exam", createdBy: actor.userId }]),
        db.insert(schema.subjects).values({ id: subjectId, examId, name: "Quantitative aptitude", sortOrder: 0 }),
        db.insert(schema.topics).values({ id: topicId, subjectId, name: "Percentages", sortOrder: 0 }),
        db.insert(schema.tests).values([{ id: testId, examId, title: "Builder test", mode: "MOCK", category: "TOPIC_SET", durationMinutes: 30 }, { id: otherTestId, examId: otherExamId, title: "Other test", mode: "MOCK", durationMinutes: 30 }]),
        db.insert(schema.testSections).values([{ id: sectionId, testId, title: "Questions", sortOrder: 0 }, { id: otherSectionId, testId: otherTestId, title: "Questions", sortOrder: 0 }]),
      ]);
      const template = testQuestionCsvTemplate();
      const invalid = template + "\n" + template.split("\n")[1].replace(",B,", ",A|B,");
      expect(await importer.importTestCsv(sectionId, topicId, invalid, actor)).toMatchObject({ status: "INVALID", importedRows: 0 });
      await expect(importer.importTestCsv(otherSectionId, topicId, template, actor)).rejects.toMatchObject({ status: 409 });
      let stored = await db.select().from(schema.questions).where(eq(schema.questions.createdBy, actor.userId));
      expect(stored).toHaveLength(0);
      const csv = template + "\n" + template.split("\n")[1].replace("What is 2 + 2?", "What is two plus two?");
      const concurrent = await Promise.allSettled([
        importer.importTestCsv(sectionId, topicId, csv, actor),
        importer.importTestCsv(sectionId, topicId, csv, actor),
      ]);
      expect(concurrent.filter(result => result.status === "fulfilled")).toHaveLength(1);
      expect(concurrent.filter(result => result.status === "rejected")).toHaveLength(1);
      await expect(importer.importTestCsv(sectionId, topicId, csv.replaceAll("\n", "\r\n"), actor)).rejects.toMatchObject({ status: 409 });
      const paper = await repository.findManagedTest(testId);
      expect(paper!.category).toBe("TOPIC_SET");
      expect(paper!.sections[0].questions.map(question => question.stem)).toEqual(["What is 2 + 2?", "What is two plus two?"]);
      expect(paper!.sections[0].questions.every(question => question.status === "DRAFT")).toBe(true);
      await repository.publishTestRecord(paper!, { actorUserId: actor.userId, requestId: actor.requestId });
      stored = await db.select().from(schema.questions).where(eq(schema.questions.createdBy, actor.userId));
      expect(stored.map(question => question.status)).toEqual(["PUBLISHED", "PUBLISHED"]);
      const revisions = await db.select().from(schema.questionRevisions).where(eq(schema.questionRevisions.createdBy, actor.userId));
      expect(revisions).toHaveLength(2); expect(revisions.every(revision => revision.publishedAt)).toBe(true);
      await expect(importer.importTestCsv(sectionId, topicId, template, actor)).rejects.toMatchObject({ status: 409 });
      const options = await db.execute(sql`select count(*)::int as total from question_options where question_id in (select id from questions where created_by = ${actor.userId}::uuid)`);
      expect(options.rows[0].total).toBe(8);
      const copied = await repository.copyTestRecord(paper!, { actorUserId: actor.userId, requestId: actor.requestId });
      copiedTestIds.push(copied.id);
      const copy = await repository.findManagedTest(copied.id);
      expect(copy!.category).toBe("TOPIC_SET");
      const oldQuestion = copy!.sections[0].questions[0];
      const { parseQuestionCsv } = await import("../../src/features/admin-imports/question-csv");
      const editedInput = { ...parseQuestionCsv(template, topicId).questions[0], stem: "What is four minus zero?" };
      await expect(importer.addTestQuestions(copy!.sections[0].id, [{ ...editedInput, topicId: randomUUID() }], actor, oldQuestion.questionId)).rejects.toMatchObject({ status: 409 });
      await importer.addTestQuestions(copy!.sections[0].id, [editedInput], actor, oldQuestion.questionId);
      await expect(importer.addTestQuestions(copy!.sections[0].id, [editedInput], actor, oldQuestion.questionId)).rejects.toMatchObject({ status: 409 });
      const [editedPaper, originalPaper, allQuestions] = await Promise.all([
        repository.findManagedTest(copied.id), repository.findManagedTest(testId),
        db.select().from(schema.questions).where(eq(schema.questions.createdBy, actor.userId)),
      ]);
      expect(editedPaper!.sections[0].questions[0]).toMatchObject({ stem: editedInput.stem, sortOrder: oldQuestion.sortOrder, status: "DRAFT" });
      expect(editedPaper!.sections[0].questions[0].questionId).not.toBe(oldQuestion.questionId);
      expect(originalPaper!.sections[0].questions[0]).toMatchObject({ questionId: oldQuestion.questionId, stem: "What is 2 + 2?", status: "PUBLISHED" });
      expect(allQuestions).toHaveLength(3);

      // Reuse in another paper is allowed; scope is enforced across all its questions.
      expect(await importer.importTestCsv(copy!.sections[0].id, topicId, csv, actor)).toMatchObject({ importedRows: 2 });
      const secondTopicId = randomUUID(), secondSubjectId = randomUUID(), thirdTopicId = randomUUID();
      await db.batch([
        db.insert(schema.subjects).values({ id: secondSubjectId, examId, name: "Reasoning", sortOrder: 1 }),
        db.insert(schema.topics).values([{ id: secondTopicId, subjectId, name: "Ratios", sortOrder: 1 }, { id: thirdTopicId, subjectId: secondSubjectId, name: "Logic", sortOrder: 0 }]),
      ]);
      await importer.importTestCsv(copy!.sections[0].id, secondTopicId, template, actor);
      await expect(repository.publishTestRecord(copy!, { actorUserId: actor.userId, requestId: actor.requestId })).rejects.toMatchObject({ status: 409 });
      await db.update(schema.tests).set({ category: "SUBJECT_TEST" }).where(eq(schema.tests.id, copied.id));
      await importer.importTestCsv(copy!.sections[0].id, thirdTopicId, template, actor);
      await expect(repository.publishTestRecord(copy!, { actorUserId: actor.userId, requestId: actor.requestId })).rejects.toMatchObject({ status: 409 });
      await db.update(schema.tests).set({ category: "FULL_MOCK" }).where(eq(schema.tests.id, copied.id));
      expect(await repository.publishTestRecord(copy!, { actorUserId: actor.userId, requestId: actor.requestId })).toMatchObject({ status: "PUBLISHED" });

      const catalog = await import("../../src/features/admin-catalog/repository");
      await db.batch([
        db.update(schema.exams).set({ status: "PUBLISHED" }).where(eq(schema.exams.id, examId)),
        db.insert(schema.materials).values({ id: materialId, examId, title: "Quant notes", type: "ARTICLE", body: "Fixture notes", status: "PUBLISHED", createdBy: actor.userId }),
      ]);
      const base = { name: "Standalone notes", slug: randomUUID(), description: "", pricePaise: 9900, accessDays: 30 };
      const audit = { actorUserId: actor.userId, requestId: actor.requestId };
      const standalone = await catalog.insertProduct({ ...base, materialIds: [materialId] }, audit); productIds.push(standalone.id);
      const bundle = await catalog.insertProduct({ ...base, slug: randomUUID(), name: "Quant bundle", pricePaise: 29900, accessDays: 90, testIds: [testId], materialIds: [materialId] }, audit); productIds.push(bundle.id);
      await expect(catalog.insertProduct({ ...base, slug: randomUUID(), testIds: [otherTestId] }, audit)).rejects.toMatchObject({ status: 409 });
      const [links, saved] = await db.batch([
        db.select().from(schema.productMaterials).where(eq(schema.productMaterials.materialId, materialId)),
        db.select().from(schema.products).where(sql`${schema.products.id} in (${standalone.id}::uuid, ${bundle.id}::uuid)`),
      ]);
      expect(links).toHaveLength(2);
      expect(saved.map(product => product.pricePaise).sort((a,b) => a-b)).toEqual([9900, 29900]);

    } finally {
      // Transactional cleanup only touches this fixture's random identifiers.
      await db.batch([
        db.delete(schema.products).where(sql`${schema.products.id} in (select jsonb_array_elements_text(${JSON.stringify(productIds)}::jsonb)::uuid)`),
        db.delete(schema.materials).where(eq(schema.materials.id, materialId)),
        db.delete(schema.tests).where(sql`${schema.tests.id} in (select jsonb_array_elements_text(${JSON.stringify([testId, otherTestId, ...copiedTestIds])}::jsonb)::uuid)`),
        db.delete(schema.questions).where(eq(schema.questions.createdBy, actor.userId)),
        db.delete(schema.contentImportJobs).where(eq(schema.contentImportJobs.requestedBy, actor.userId)),
        db.delete(schema.exams).where(sql`${schema.exams.id} in (${examId}::uuid, ${otherExamId}::uuid)`),
        db.delete(schema.auditLogs).where(eq(schema.auditLogs.actorUserId, actor.userId)),
        db.delete(schema.users).where(eq(schema.users.id, actor.userId)),
      ]);
    }
  }, 600_000);
});
