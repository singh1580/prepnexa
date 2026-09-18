import { randomUUID } from "node:crypto";
import { asc, countDistinct, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, exams, subjects, topics } from "@/db/schema";

type AuditContext = { actorUserId: string; requestId: string };
type ExamInput = { name: string; slug: string; description: string };
type TaxonomyInput = { name: string; sortOrder: number };

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
