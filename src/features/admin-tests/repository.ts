import { randomUUID } from "node:crypto";
import { and, asc, countDistinct, desc, eq, ne } from "drizzle-orm";
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
  const now = new Date(); await db.batch([db.update(tests).set({ status: "PUBLISHED", updatedAt: now }).where(eq(tests.id, before.id)), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "test.published", entityType: "test", entityId: before.id, requestId: audit.requestId, before: { status: before.status }, after: { status: "PUBLISHED" } })]); return { id: before.id, status: "PUBLISHED" as const };
}
