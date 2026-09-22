import { randomUUID } from "node:crypto";
import { and, asc, count, countDistinct, desc, eq, ilike, isNull, ne, sql } from "drizzle-orm";
import { testStateConflict } from "./errors";
import { db } from "@/db/client";
import { auditLogs, products, productTests, exams, questions, subjects, testQuestions, testSchedules, testSections, tests, topics } from "@/db/schema";

type Audit = { actorUserId: string; requestId: string };
export type TestInput = { category?: "FULL_MOCK" | "SUBJECT_TEST" | "TOPIC_SET" | null; examId: string; title: string; mode: "PRACTICE" | "MOCK" | "LIVE"; durationMinutes: number; instructions: string; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean };
export type SectionInput = { title: string; durationMinutes: number | null; sortOrder: number };
export type ScheduleInput = { startsAt: string; endsAt: string; lateJoinMinutes: number; resultReleaseAt: string | null; rankingEnabled: boolean; cohortKey: string };

export const listTestExams = () => db.select({ id: exams.id, name: exams.name }).from(exams).where(ne(exams.status, "ARCHIVED")).orderBy(asc(exams.name));
export type ManagedTestFilters = {
  examId?: string; subjectId?: string; topicId?: string; query?: string;
  category?: "FULL_MOCK" | "SUBJECT_TEST" | "TOPIC_SET" | "UNCLASSIFIED";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; page: number; pageSize: number;
};
export async function listManagedTests(filters: ManagedTestFilters) {
  const curriculum = filters.topicId || filters.subjectId ? sql`exists (
    select 1 from test_questions tq
    join questions q on q.id = tq.question_id
    join topics tp on tp.id = q.topic_id
    where tq.test_id = ${tests.id}
      and (${filters.topicId ?? null}::uuid is null or tp.id = ${filters.topicId ?? null}::uuid)
      and (${filters.subjectId ?? null}::uuid is null or tp.subject_id = ${filters.subjectId ?? null}::uuid)
  )` : undefined;
  const where = and(
    eq(tests.mode, "MOCK"),
    filters.examId ? eq(tests.examId, filters.examId) : undefined,
    filters.status ? eq(tests.status, filters.status) : undefined,
    filters.category === "UNCLASSIFIED" ? isNull(tests.category) : filters.category ? eq(tests.category, filters.category) : undefined,
    filters.query ? ilike(tests.title, `%${filters.query}%`) : undefined,
    curriculum,
  );
  const offset = (filters.page - 1) * filters.pageSize;
  const [items, totals] = await db.batch([
    db.select({ id: tests.id, examId: tests.examId, title: tests.title, mode: tests.mode, category: tests.category, status: tests.status, durationMinutes: tests.durationMinutes, examName: exams.name, sectionCount: countDistinct(testSections.id), questionCount: countDistinct(testQuestions.questionId) }).from(tests)
      .innerJoin(exams, eq(tests.examId, exams.id)).leftJoin(testSections, eq(testSections.testId, tests.id)).leftJoin(testQuestions, eq(testQuestions.testId, tests.id))
      .where(where).groupBy(tests.id, exams.name).orderBy(desc(tests.updatedAt), desc(tests.id)).limit(filters.pageSize).offset(offset),
    db.select({ total: count() }).from(tests).innerJoin(exams, eq(tests.examId, exams.id)).where(where),
  ]);
  const total = totals[0]?.total ?? 0;
  return { items, total, page: filters.page, pageSize: filters.pageSize, totalPages: Math.max(1, Math.ceil(total / filters.pageSize)) };
}

export async function listTestFilterTaxonomy() {
  const [subjectRows, topicRows] = await Promise.all([
    db.select({ id: subjects.id, name: subjects.name, examId: exams.id, examName: exams.name }).from(subjects).innerJoin(exams, eq(subjects.examId, exams.id)).where(ne(exams.status, "ARCHIVED")).orderBy(asc(exams.name), asc(subjects.name)),
    db.select({ id: topics.id, name: topics.name, subjectId: subjects.id, subjectName: subjects.name, examId: exams.id, examName: exams.name }).from(topics).innerJoin(subjects, eq(topics.subjectId, subjects.id)).innerJoin(exams, eq(subjects.examId, exams.id)).where(ne(exams.status, "ARCHIVED")).orderBy(asc(exams.name), asc(subjects.name), asc(topics.name)),
  ]);
  return { subjects: subjectRows, topics: topicRows };
}
export async function findManagedTest(id: string) {
  const [test] = await db.select({ id: tests.id, examId: tests.examId, title: tests.title, mode: tests.mode, category: tests.category, durationMinutes: tests.durationMinutes, instructions: tests.instructions, maxAttempts: tests.maxAttempts, shuffleQuestions: tests.shuffleQuestions, shuffleOptions: tests.shuffleOptions, status: tests.status, examName: exams.name }).from(tests).innerJoin(exams, eq(tests.examId, exams.id)).where(eq(tests.id, id)).limit(1);
  if (!test) return undefined;
  const [sections, assignments, schedules, availableQuestions] = await Promise.all([
    db.select().from(testSections).where(eq(testSections.testId, id)).orderBy(asc(testSections.sortOrder)),
    db.select({ testId: testQuestions.testId, sectionId: testQuestions.sectionId, questionId: testQuestions.questionId, sortOrder: testQuestions.sortOrder, stem: questions.stem, type: questions.type, status: questions.status, explanation: questions.explanation,
      marks: questions.marks, negativeMarks: questions.negativeMarks,
      options: sql<{ body: string; correct: boolean }[]>`coalesce((select jsonb_agg(jsonb_build_object('body', o.body, 'correct', o.is_correct) order by o.sort_order) from question_options o where o.question_id = ${questions.id}), '[]'::jsonb)`,
      answerConfig: sql<Record<string, unknown>>`(select r.answer_config from question_revisions r where r.question_id = ${questions.id} order by r.version desc limit 1)`
    }).from(testQuestions).innerJoin(questions, eq(testQuestions.questionId, questions.id)).where(eq(testQuestions.testId, id)).orderBy(asc(testQuestions.sortOrder)),
    db.select().from(testSchedules).where(eq(testSchedules.testId, id)).orderBy(desc(testSchedules.startsAt)),
    db.select({ id: questions.id, stem: questions.stem, topicName: topics.name, subjectName: subjects.name }).from(questions).innerJoin(topics, eq(questions.topicId, topics.id)).innerJoin(subjects, eq(topics.subjectId, subjects.id)).where(and(eq(subjects.examId, test.examId), eq(questions.status, "PUBLISHED"))).orderBy(asc(subjects.name), asc(topics.name)),
  ]);
  return { ...test, sections: sections.map((section) => ({ ...section, questions: assignments.filter((item) => item.sectionId === section.id) })), schedules, availableQuestions };
}
export const findTest = (id: string) => db.query.tests.findFirst({ where: eq(tests.id, id) });
export const findSection = (id: string) => db.query.testSections.findFirst({ where: eq(testSections.id, id) });
export async function findPublishedQuestionForExam(id: string, examId: string) {
  const [question] = await db.select({ id: questions.id }).from(questions).innerJoin(topics, eq(questions.topicId, topics.id)).innerJoin(subjects, eq(topics.subjectId, subjects.id)).where(and(eq(questions.id, id), eq(questions.status, "PUBLISHED"), eq(subjects.examId, examId))).limit(1);
  return question;
}

export async function insertTest(input: TestInput, audit: Audit) {
  const id = randomUUID(); const now = new Date();
  await db.batch([db.insert(tests).values({ id, ...input, instructions: input.instructions || null, status: "DRAFT", createdAt: now, updatedAt: now }), db.insert(testSections).values({ id: randomUUID(), testId: id, title: "Questions", sortOrder: 0 }), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test.created", entityType: "test", entityId: id, requestId: audit.requestId, after: { ...input, status: "DRAFT" } })]); return { id };
}
export async function patchTest(before: NonNullable<Awaited<ReturnType<typeof findTest>>>, input: TestInput, audit: Audit) {
  const now = new Date(); await db.batch([db.update(tests).set({ ...input, instructions: input.instructions || null, updatedAt: now }).where(eq(tests.id, before.id)), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test.updated", entityType: "test", entityId: before.id, requestId: audit.requestId, before, after: { ...before, ...input, updatedAt: now } })]); return { id: before.id };
}
export async function insertSection(testId: string, input: SectionInput, audit: Audit) {
  const id = randomUUID(); await db.batch([db.insert(testSections).values({ id, testId, ...input }), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test_section.created", entityType: "test_section", entityId: id, requestId: audit.requestId, after: { testId, ...input } })]); return { id };
}
export async function insertAssignment(testId: string, sectionId: string, questionId: string, sortOrder: number, audit: Audit) {
  await db.batch([db.insert(testQuestions).values({ testId, sectionId, questionId, sortOrder }), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test_question.assigned", entityType: "test", entityId: testId, requestId: audit.requestId, after: { sectionId, questionId, sortOrder } })]); return { testId, questionId };
}
export async function insertSchedule(testId: string, input: ScheduleInput, audit: Audit) {
  const id = randomUUID(); const values = { id, testId, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), lateJoinMinutes: input.lateJoinMinutes, resultReleaseAt: input.resultReleaseAt ? new Date(input.resultReleaseAt) : null, rankingEnabled: input.rankingEnabled, cohortKey: input.cohortKey || null };
  await db.batch([db.insert(testSchedules).values(values), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test_schedule.created", entityType: "test_schedule", entityId: id, requestId: audit.requestId, after: values })]); return { id };
}
export async function publishTestRecord(before: NonNullable<Awaited<ReturnType<typeof findManagedTest>>>, audit: Audit) {
  const result = await db.execute(sql`
    with locked_test as (
      select id, category from ${tests} where id = ${before.id} and status = 'DRAFT' and mode = 'MOCK' for update
    ), published as (
      update ${tests} set status = 'PUBLISHED', updated_at = now()
      where id in (select id from locked_test)
        and exists (select 1 from ${testSections} where test_id = ${before.id})
        and ((select category from locked_test) is null or (select category from locked_test) = 'FULL_MOCK'
          or (select count(distinct case when (select category from locked_test) = 'TOPIC_SET'
            then p.id else p.subject_id end) from test_questions tq join questions q on q.id = tq.question_id
            join topics p on p.id = q.topic_id where tq.test_id = ${before.id}) = 1)
        and not exists (
          select 1 from test_questions tq join questions q on q.id = tq.question_id
          join topics p on p.id = q.topic_id join subjects su on su.id = p.subject_id
          where tq.test_id = ${before.id} and (q.status = 'ARCHIVED' or su.exam_id <> ${before.examId}::uuid
            or not exists (select 1 from question_revisions r where r.question_id = q.id))
        )
        and coalesce((select sum(duration_minutes) from test_sections where test_id = ${before.id}), 0)
          <= (select duration_minutes from tests where id = ${before.id})
        and not exists (
          select 1 from ${testSections} s where s.test_id = ${before.id}
          and not exists (select 1 from ${testQuestions} q where q.section_id = s.id)
        )
      returning id
    ), published_questions as (
      update questions set status = 'PUBLISHED', published_at = now(), updated_at = now()
      where status in ('DRAFT', 'IN_REVIEW') and id in (
        select question_id from test_questions where test_id in (select id from published)
      ) returning id
    ), published_revisions as (
      update question_revisions r set published_at = now()
      where r.question_id in (select id from published_questions)
        and r.version = (select max(v.version) from question_revisions v where v.question_id = r.question_id)
      returning id
    )
    insert into ${auditLogs} ("actor_user_id", "action", "entity_type", "entity_id", "request_id", "after")
    select ${audit.actorUserId}, 'test.published', 'test', id::text, ${audit.requestId},
      '{"status":"PUBLISHED"}'::jsonb from published returning entity_id
  `);
  if (!result.rows.length) throw testStateConflict("Cannot publish: check every section has questions, timing fits, and Subject tests / Topic sets contain only one subject / topic. Refresh if the paper changed.");
  return { id: before.id, status: "PUBLISHED" as const };
}

// Lock the parent test so removing content cannot race a cooperating publisher.
export async function removeDraftItem(sectionId: string, questionId: string | null, audit: Audit) {
  const removal = questionId
    ? sql`delete from ${testQuestions} where section_id = ${sectionId} and question_id = ${questionId} and test_id in (select id from locked_test) returning test_id`
    : sql`delete from ${testSections} where id = ${sectionId} and test_id in (select id from locked_test)
        and not exists (select 1 from ${testQuestions} where section_id = ${sectionId}) returning test_id`;
  const result = await db.execute(sql`
    with locked_test as (
      select id from ${tests} where id = (select test_id from ${testSections} where id = ${sectionId})
        and status = 'DRAFT' and mode = 'MOCK' for update
    ), removed as (${removal})
    insert into ${auditLogs} ("actor_user_id", "action", "entity_type", "entity_id", "request_id", "after")
    select ${audit.actorUserId}, ${questionId ? "test_question.removed" : "test_section.removed"},
      'test', test_id::text, ${audit.requestId},
      jsonb_build_object('sectionId', ${sectionId}::text, 'questionId', ${questionId}::text)
    from removed returning entity_id
  `);
  return result.rows.length > 0;
}

export async function patchSection(id: string, input: SectionInput, audit: Audit) {
  await db.batch([
    db.update(testSections).set(input).where(eq(testSections.id, id)),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test_section.updated", entityType: "test_section", entityId: id, requestId: audit.requestId, after: input }),
  ]);
  return { id };
}
export async function replaceQuestionOrder(testId: string, sectionId: string, questionIds: string[], audit: Audit) {
  await db.batch([
    db.delete(testQuestions).where(and(eq(testQuestions.testId, testId), eq(testQuestions.sectionId, sectionId))),
    db.insert(testQuestions).values(questionIds.map((questionId, sortOrder) => ({ testId, sectionId, questionId, sortOrder }))),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test_questions.reordered", entityType: "test", entityId: testId, requestId: audit.requestId, after: { sectionId, questionIds } }),
  ]);
  return { id: testId };
}
export async function testHasPublishedPackage(id: string) {
  const rows = await db.select({ id: products.id }).from(productTests).innerJoin(products, eq(productTests.productId, products.id)).where(and(eq(productTests.testId, id), eq(products.status, "PUBLISHED"))).limit(1);
  return rows.length > 0;
}
export async function archiveTestRecord(id: string, audit: Audit) {
  await db.batch([
    db.update(tests).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(tests.id, id)),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test.archived", entityType: "test", entityId: id, requestId: audit.requestId, after: { status: "ARCHIVED" } }),
  ]);
  return { id };
}
export async function copyTestRecord(before: NonNullable<Awaited<ReturnType<typeof findManagedTest>>>, audit: Audit) {
  const id = randomUUID();
  const sectionCopies = before.sections.map(section => ({ ...section, newId: randomUUID() }));
  const create = db.insert(tests).values({ id, examId: before.examId, category: before.category, title: before.title.slice(0, 190) + " (copy)", mode: "MOCK", durationMinutes: before.durationMinutes, instructions: before.instructions, maxAttempts: before.maxAttempts, shuffleQuestions: before.shuffleQuestions, shuffleOptions: before.shuffleOptions, status: "DRAFT" });
  const auditEntry = db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test.copied", entityType: "test", entityId: id, requestId: audit.requestId, after: { sourceTestId: before.id } });
  const assignments = sectionCopies.flatMap(section => section.questions.map(question => ({ testId: id, sectionId: section.newId, questionId: question.questionId, sortOrder: question.sortOrder })));
  if (!sectionCopies.length) await db.batch([create, auditEntry]);
  else {
    const createSections = db.insert(testSections).values(sectionCopies.map(section => ({ id: section.newId, testId: id, title: section.title, durationMinutes: section.durationMinutes, sortOrder: section.sortOrder })));
    if (assignments.length) await db.batch([create, createSections, db.insert(testQuestions).values(assignments), auditEntry]);
    else await db.batch([create, createSections, auditEntry]);
  }
  return { id };
}

export function listTopicsForTest(examId: string) {
  return db.select({ id: topics.id, topicName: topics.name, subjectName: subjects.name, examName: exams.name })
    .from(topics).innerJoin(subjects, eq(topics.subjectId, subjects.id)).innerJoin(exams, eq(subjects.examId, exams.id))
    .where(eq(exams.id, examId)).orderBy(asc(subjects.name), asc(topics.name));
}
