import { randomUUID } from "node:crypto";
import { and, asc, countDistinct, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, exams, materials, questionOptions, questionRevisionOptions, questionRevisions, questions, subjects, testQuestions, tests, topics } from "@/db/schema";

type AuditContext = { actorUserId: string; requestId: string };
type ExamInput = { name: string; slug: string; description: string };
type TaxonomyInput = { name: string; sortOrder: number };
export type QuestionInput = {
  topicId: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "NUMERIC" | "TEXT";
  stem: string; explanation: string; marks: number; negativeMarks: number; difficulty: "EASY" | "MEDIUM" | "HARD";
  options: { stableKey: string; body: string; isCorrect: boolean; sortOrder: number }[];
  numericAnswer: number | null; numericTolerance: number; acceptedAnswers: string[]; caseSensitive: boolean;
};

export function listExams() {
  return db.select({
    id: exams.id, name: exams.name, slug: exams.slug, description: exams.description,
    status: exams.status, updatedAt: exams.updatedAt, subjectCount: countDistinct(subjects.id), topicCount: countDistinct(topics.id),
  }).from(exams)
    .leftJoin(subjects, eq(subjects.examId, exams.id))
    .leftJoin(topics, eq(topics.subjectId, subjects.id))
    .groupBy(exams.id).orderBy(asc(exams.name));
}

export async function findExamTree(id: string) {
  const exam = await db.query.exams.findFirst({ where: eq(exams.id, id) });
  if (!exam) return undefined;
  const [subjectRows, topicRows] = await Promise.all([
    db.select().from(subjects).where(eq(subjects.examId, id)).orderBy(asc(subjects.sortOrder), asc(subjects.name)),
    db.select({ id: topics.id, subjectId: topics.subjectId, name: topics.name, sortOrder: topics.sortOrder })
      .from(topics).innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(subjects.examId, id)).orderBy(asc(topics.sortOrder), asc(topics.name)),
  ]);
  return { ...exam, subjects: subjectRows.map((subject) => ({ ...subject, topics: topicRows.filter((topic) => topic.subjectId === subject.id) })) };
}

export function findExam(id: string) {
  return db.query.exams.findFirst({ where: eq(exams.id, id) });
}
export function findSubject(id: string) {
  return db.query.subjects.findFirst({ where: eq(subjects.id, id) });
}
export function findTopic(id: string) {
  return db.query.topics.findFirst({ where: eq(topics.id, id) });
}

export async function insertExam(input: ExamInput, audit: AuditContext) {
  const id = randomUUID();
  const now = new Date();
  await db.batch([
    db.insert(exams).values({ id, ...input, description: input.description || null, status: "DRAFT", createdBy: audit.actorUserId, createdAt: now, updatedAt: now }),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "exam.created", entityType: "exam", entityId: id, requestId: audit.requestId, after: { ...input, status: "DRAFT" } }),
  ]);
  return { id };
}

export async function patchExam(before: NonNullable<Awaited<ReturnType<typeof findExam>>>, input: ExamInput, audit: AuditContext) {
  const now = new Date();
  await db.batch([
    db.update(exams).set({ ...input, description: input.description || null, updatedAt: now }).where(eq(exams.id, before.id)),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "exam.updated", entityType: "exam", entityId: before.id, requestId: audit.requestId, before, after: { ...before, ...input, updatedAt: now } }),
  ]);
}

export async function setExamStatus(before: NonNullable<Awaited<ReturnType<typeof findExam>>>, status: "PUBLISHED" | "ARCHIVED", audit: AuditContext) {
  const now = new Date(); await db.batch([db.update(exams).set({ status, updatedAt: now }).where(eq(exams.id, before.id)), db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: `exam.${status.toLowerCase()}`, entityType: "exam", entityId: before.id, requestId: audit.requestId, before: { status: before.status }, after: { status } })]); return { id: before.id, status };
}

export async function insertSubject(examId: string, input: TaxonomyInput, audit: AuditContext) {
  const id = randomUUID();
  await db.batch([
    db.insert(subjects).values({ id, examId, ...input }),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "subject.created", entityType: "subject", entityId: id, requestId: audit.requestId, after: { examId, ...input } }),
  ]);
  return { id };
}

export async function patchSubject(before: NonNullable<Awaited<ReturnType<typeof findSubject>>>, input: TaxonomyInput, audit: AuditContext) {
  await db.batch([
    db.update(subjects).set(input).where(eq(subjects.id, before.id)),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "subject.updated", entityType: "subject", entityId: before.id, requestId: audit.requestId, before, after: { ...before, ...input } }),
  ]);
}

export async function insertTopic(subjectId: string, input: TaxonomyInput, audit: AuditContext) {
  const id = randomUUID();
  await db.batch([
    db.insert(topics).values({ id, subjectId, ...input }),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "topic.created", entityType: "topic", entityId: id, requestId: audit.requestId, after: { subjectId, ...input } }),
  ]);
  return { id };
}

export async function patchTopic(before: NonNullable<Awaited<ReturnType<typeof findTopic>>>, input: TaxonomyInput, audit: AuditContext) {
  await db.batch([
    db.update(topics).set(input).where(eq(topics.id, before.id)),
    db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: "topic.updated", entityType: "topic", entityId: before.id, requestId: audit.requestId, before, after: { ...before, ...input } }),
  ]);
}

export function listQuestionTopics() {
  return db.select({
    id: topics.id, topicName: topics.name, subjectName: subjects.name, examName: exams.name,
  }).from(topics)
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .innerJoin(exams, eq(subjects.examId, exams.id))
    .where(ne(exams.status, "ARCHIVED"))
    .orderBy(asc(exams.name), asc(subjects.sortOrder), asc(topics.sortOrder));
}

export function listQuestions() {
  return db.select({
    id: questions.id, stem: questions.stem, type: questions.type, difficulty: questions.difficulty,
    status: questions.status, createdBy: questions.createdBy, reviewedBy: questions.reviewedBy,
    updatedAt: questions.updatedAt, topicName: topics.name, subjectName: subjects.name, examName: exams.name,
  }).from(questions)
    .innerJoin(topics, eq(questions.topicId, topics.id))
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .innerJoin(exams, eq(subjects.examId, exams.id))
    .orderBy(desc(questions.updatedAt));
}

export async function findQuestion(id: string) {
  const [question] = await db.select({
    id: questions.id, topicId: questions.topicId, type: questions.type, stem: questions.stem,
    explanation: questions.explanation, marks: questions.marks, negativeMarks: questions.negativeMarks,
    difficulty: questions.difficulty, status: questions.status, createdBy: questions.createdBy,
    reviewedBy: questions.reviewedBy, publishedAt: questions.publishedAt, createdAt: questions.createdAt,
    updatedAt: questions.updatedAt, topicName: topics.name, subjectName: subjects.name, examName: exams.name,
  }).from(questions)
    .innerJoin(topics, eq(questions.topicId, topics.id))
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .innerJoin(exams, eq(subjects.examId, exams.id))
    .where(eq(questions.id, id)).limit(1);
  if (!question) return undefined;
  const [revision] = await db.select().from(questionRevisions)
    .where(eq(questionRevisions.questionId, id)).orderBy(desc(questionRevisions.version)).limit(1);
  const optionRows = await db.select({
    body: questionOptions.body, isCorrect: questionOptions.isCorrect,
    sortOrder: questionOptions.sortOrder,
  }).from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.sortOrder));
  const options = optionRows.map((option, index) => ({ ...option, stableKey: String.fromCharCode(65 + index) }));
  return { ...question, revision, options };
}

function answerConfig(input: QuestionInput) {
  if (input.type === "NUMERIC") return { type: input.type, value: input.numericAnswer, tolerance: input.numericTolerance };
  if (input.type === "TEXT") return { type: input.type, acceptedAnswers: input.acceptedAnswers, caseSensitive: input.caseSensitive };
  return { type: input.type, correctOptionKeys: input.options.filter((option) => option.isCorrect).map((option) => option.stableKey) };
}

function currentQuestionValues(input: QuestionInput, now: Date) {
  return {
    topicId: input.topicId, type: input.type, stem: input.stem, explanation: input.explanation || null,
    marks: String(input.marks), negativeMarks: String(input.negativeMarks), difficulty: input.difficulty, updatedAt: now,
  };
}

function optionValues(questionId: string, input: QuestionInput) {
  return input.options.map((option) => ({
    id: randomUUID(), questionId, body: option.body, isCorrect: option.isCorrect, sortOrder: option.sortOrder,
  }));
}

function revisionOptionValues(revisionId: string, input: QuestionInput) {
  return input.options.map((option) => ({ revisionId, ...option }));
}

export async function insertQuestion(input: QuestionInput, audit: AuditContext) {
  const id = randomUUID(); const revisionId = randomUUID(); const now = new Date();
  const question = { id, ...currentQuestionValues(input, now), status: "DRAFT" as const, createdBy: audit.actorUserId, createdAt: now };
  const revision = { id: revisionId, questionId: id, version: 1, stem: input.stem, explanation: input.explanation || null, marks: String(input.marks), negativeMarks: String(input.negativeMarks), answerConfig: answerConfig(input), createdBy: audit.actorUserId, createdAt: now };
  const auditRow = { actorUserId: audit.actorUserId, action: "question.created", entityType: "question", entityId: id, requestId: audit.requestId, after: { ...input, status: "DRAFT", version: 1 } };
  if (input.options.length) await db.batch([db.insert(questions).values(question), db.insert(questionOptions).values(optionValues(id, input)), db.insert(questionRevisions).values(revision), db.insert(questionRevisionOptions).values(revisionOptionValues(revisionId, input)), db.insert(auditLogs).values(auditRow)]);
  else await db.batch([db.insert(questions).values(question), db.insert(questionRevisions).values(revision), db.insert(auditLogs).values(auditRow)]);
  return { id };
}

export async function patchQuestion(before: NonNullable<Awaited<ReturnType<typeof findQuestion>>>, input: QuestionInput, audit: AuditContext) {
  const revisionId = randomUUID(); const now = new Date(); const version = (before.revision?.version ?? 0) + 1;
  const revision = { id: revisionId, questionId: before.id, version, stem: input.stem, explanation: input.explanation || null, marks: String(input.marks), negativeMarks: String(input.negativeMarks), answerConfig: answerConfig(input), createdBy: audit.actorUserId, createdAt: now };
  const auditRow = { actorUserId: audit.actorUserId, action: "question.updated", entityType: "question", entityId: before.id, requestId: audit.requestId, before, after: { ...input, status: before.status, version } };
  if (input.options.length) await db.batch([db.update(questions).set(currentQuestionValues(input, now)).where(eq(questions.id, before.id)), db.delete(questionOptions).where(eq(questionOptions.questionId, before.id)), db.insert(questionOptions).values(optionValues(before.id, input)), db.insert(questionRevisions).values(revision), db.insert(questionRevisionOptions).values(revisionOptionValues(revisionId, input)), db.insert(auditLogs).values(auditRow)]);
  else await db.batch([db.update(questions).set(currentQuestionValues(input, now)).where(eq(questions.id, before.id)), db.delete(questionOptions).where(eq(questionOptions.questionId, before.id)), db.insert(questionRevisions).values(revision), db.insert(auditLogs).values(auditRow)]);
  return { id: before.id, version };
}

export async function setQuestionReviewState(before: NonNullable<Awaited<ReturnType<typeof findQuestion>>>, action: "SUBMIT" | "APPROVE" | "RETURN" | "PUBLISH" | "ARCHIVE", audit: AuditContext) {
  const now = new Date();
  const state = action === "SUBMIT" ? { status: "IN_REVIEW" as const, reviewedBy: null, publishedAt: null }
    : action === "APPROVE" ? { status: "IN_REVIEW" as const, reviewedBy: audit.actorUserId }
      : action === "RETURN" ? { status: "DRAFT" as const, reviewedBy: null, publishedAt: null }
        : action === "PUBLISH" ? { status: "PUBLISHED" as const, publishedAt: now }
          : { status: "ARCHIVED" as const };
  const revisionState = action === "APPROVE" ? { reviewedBy: audit.actorUserId }
    : action === "PUBLISH" ? { publishedAt: now }
      : action === "SUBMIT" || action === "RETURN" ? { reviewedBy: null, publishedAt: null } : {};
  const revisionId = before.revision?.id;
  const updateRevision = revisionId ? db.update(questionRevisions).set(revisionState).where(and(eq(questionRevisions.id, revisionId), eq(questionRevisions.questionId, before.id))) : undefined;
  const auditRow = db.insert(auditLogs).values({ actorUserId: audit.actorUserId, action: `question.${action.toLowerCase()}`, entityType: "question", entityId: before.id, requestId: audit.requestId, before: { status: before.status, reviewedBy: before.reviewedBy }, after: state });
  const updateQuestion = db.update(questions).set({ ...state, updatedAt: now }).where(eq(questions.id, before.id));
  if (updateRevision) await db.batch([updateQuestion, updateRevision, auditRow]); else await db.batch([updateQuestion, auditRow]);
  return { id: before.id, status: state.status };
}

export async function questionHasPublishedTest(id: string) { const [row] = await db.select({ id: tests.id }).from(testQuestions).innerJoin(tests, eq(testQuestions.testId, tests.id)).where(and(eq(testQuestions.questionId, id), eq(tests.status, "PUBLISHED"))).limit(1); return Boolean(row); }
export async function examHasPublishedDependencies(id: string) { const [test, material] = await Promise.all([db.select({ id: tests.id }).from(tests).where(and(eq(tests.examId, id), eq(tests.status, "PUBLISHED"))).limit(1), db.select({ id: materials.id }).from(materials).where(and(eq(materials.examId, id), eq(materials.status, "PUBLISHED"))).limit(1)]); return Boolean(test[0] || material[0]); }
