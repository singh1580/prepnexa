import { randomUUID } from "node:crypto";
import { and, asc, countDistinct, desc, eq, ne, sql } from "drizzle-orm";
import { testStateConflict } from "./errors";
import { db } from "@/db/client";
import { auditLogs, exams, questions, subjects, testQuestions, testSchedules, testSections, tests, topics } from "@/db/schema";

type Audit = { actorUserId: string; requestId: string };
export type TestInput = { examId: string; title: string; mode: "PRACTICE" | "MOCK" | "LIVE"; durationMinutes: number; instructions: string; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean };
export type SectionInput = { title: string; durationMinutes: number | null; sortOrder: number };
export type ScheduleInput = { startsAt: string; endsAt: string; lateJoinMinutes: number; resultReleaseAt: string | null; rankingEnabled: boolean; cohortKey: string };

export const listTestExams = () => db.select({ id: exams.id, name: exams.name }).from(exams).where(ne(exams.status, "ARCHIVED")).orderBy(asc(exams.name));
export function listManagedTests() {
  return db.select({ id: tests.id, title: tests.title, mode: tests.mode, status: tests.status, durationMinutes: tests.durationMinutes, examName: exams.name, sectionCount: countDistinct(testSections.id), questionCount: countDistinct(testQuestions.questionId) }).from(tests)
    .innerJoin(exams, eq(tests.examId, exams.id)).leftJoin(testSections, eq(testSections.testId, tests.id)).leftJoin(testQuestions, eq(testQuestions.testId, tests.id))
    .groupBy(tests.id, exams.name).orderBy(desc(tests.updatedAt));
}
export async function findManagedTest(id: string) {
  const [test] = await db.select({ id: tests.id, examId: tests.examId, title: tests.title, mode: tests.mode, durationMinutes: tests.durationMinutes, instructions: tests.instructions, maxAttempts: tests.maxAttempts, shuffleQuestions: tests.shuffleQuestions, shuffleOptions: tests.shuffleOptions, status: tests.status, examName: exams.name }).from(tests).innerJoin(exams, eq(tests.examId, exams.id)).where(eq(tests.id, id)).limit(1);
  if (!test) return undefined;
  const [sections, assignments, schedules, availableQuestions] = await Promise.all([
    db.select().from(testSections).where(eq(testSections.testId, id)).orderBy(asc(testSections.sortOrder)),
    db.select({ testId: testQuestions.testId, sectionId: testQuestions.sectionId, questionId: testQuestions.questionId, sortOrder: testQuestions.sortOrder, stem: questions.stem, type: questions.type }).from(testQuestions).innerJoin(questions, eq(testQuestions.questionId, questions.id)).where(eq(testQuestions.testId, id)).orderBy(asc(testQuestions.sortOrder)),
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
  await db.batch([db.insert(tests).values({ id, ...input, instructions: input.instructions || null, status: "DRAFT", createdAt: now, updatedAt: now }), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test.created", entityType: "test", entityId: id, requestId: audit.requestId, after: { ...input, status: "DRAFT" } })]); return { id };
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
      select id from ${tests} where id = ${before.id} and status = 'DRAFT' and mode = 'MOCK' for update
    ), published as (
      update ${tests} set status = 'PUBLISHED', updated_at = now()
      where id in (select id from locked_test)
        and exists (select 1 from ${testSections} where test_id = ${before.id})
        and not exists (
          select 1 from ${testSections} s where s.test_id = ${before.id}
          and not exists (select 1 from ${testQuestions} q where q.section_id = s.id)
        )
      returning id
    )
    insert into ${auditLogs} ("actor_user_id", "action", "entity_type", "entity_id", "request_id", "after")
    select ${audit.actorUserId}, 'test.published', 'test', id::text, ${audit.requestId},
      '{"status":"PUBLISHED"}'::jsonb from published returning entity_id
  `);
  if (!result.rows.length) throw testStateConflict("The test changed before publishing. Refresh and try again.");
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
