import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, contentImportErrors, contentImportJobs, questionOptions, questionRevisionOptions, questionRevisions, questions, topics } from "@/db/schema";
import type { QuestionInput } from "@/features/admin-content/repository";
import type { ImportIssue } from "./question-csv";

type Context = { actorUserId: string; requestId: string; objectKey: string };
function answerConfig(input: QuestionInput) { if (input.type === "NUMERIC") return { type: input.type, value: input.numericAnswer, tolerance: input.numericTolerance }; if (input.type === "TEXT") return { type: input.type, acceptedAnswers: input.acceptedAnswers, caseSensitive: input.caseSensitive }; return { type: input.type, correctOptionKeys: input.options.filter((option) => option.isCorrect).map((option) => option.stableKey) }; }

export async function recordInvalidImport(totalRows: number, issues: ImportIssue[], context: Context) {
  const id = randomUUID(); const now = new Date();
  const invalidRows = issues.some((issue) => issue.rowNumber === 1) ? totalRows : new Set(issues.map((issue) => issue.rowNumber)).size;
  await db.batch([db.insert(contentImportJobs).values({ id, type: "QUESTIONS_CSV", status: "INVALID", objectKey: context.objectKey, totalRows, validRows: Math.max(0, totalRows - invalidRows), invalidRows, requestedBy: context.actorUserId, error: "Validation failed", createdAt: now, completedAt: now }), db.insert(contentImportErrors).values(issues.map((issue) => ({ id: randomUUID(), jobId: id, ...issue }))), db.insert(auditLogs).values({ actorUserId: context.actorUserId, action: "question_import.invalid", entityType: "content_import_job", entityId: id, requestId: context.requestId, after: { totalRows, issueCount: issues.length } })]); return { id, status: "INVALID" as const, totalRows, importedRows: 0, issues };
}

export async function findExistingTopicIds(ids: string[]) { if (!ids.length) return new Set<string>(); const rows = await db.select({ id: topics.id }).from(topics).where(inArray(topics.id, ids)); return new Set(rows.map((row) => row.id)); }

export async function importQuestionRows(inputs: QuestionInput[], context: Context) {
  const jobId = randomUUID(); const now = new Date();
  const records = inputs.map((input) => ({ input, questionId: randomUUID(), revisionId: randomUUID() }));
  const questionRows = records.map(({ input, questionId }) => ({ id: questionId, topicId: input.topicId, type: input.type, stem: input.stem, explanation: input.explanation || null, marks: String(input.marks), negativeMarks: String(input.negativeMarks), difficulty: input.difficulty, status: "DRAFT" as const, createdBy: context.actorUserId, createdAt: now, updatedAt: now }));
  const revisionRows = records.map(({ input, questionId, revisionId }) => ({ id: revisionId, questionId, version: 1, stem: input.stem, explanation: input.explanation || null, marks: String(input.marks), negativeMarks: String(input.negativeMarks), answerConfig: answerConfig(input), createdBy: context.actorUserId, createdAt: now }));
  const optionRows = records.flatMap(({ input, questionId }) => input.options.map((option) => ({ id: randomUUID(), questionId, body: option.body, isCorrect: option.isCorrect, sortOrder: option.sortOrder })));
  const revisionOptionRows = records.flatMap(({ input, revisionId }) => input.options.map((option) => ({ revisionId, ...option })));
  const auditRows = records.map(({ input, questionId }) => ({ actorUserId: context.actorUserId, action: "question.imported", entityType: "question", entityId: questionId, requestId: context.requestId, after: { topicId: input.topicId, type: input.type, status: "DRAFT", importJobId: jobId } }));
  const job = db.insert(contentImportJobs).values({ id: jobId, type: "QUESTIONS_CSV", status: "IMPORTED", objectKey: context.objectKey, totalRows: inputs.length, validRows: inputs.length, invalidRows: 0, requestedBy: context.actorUserId, createdAt: now, completedAt: now });
  if (optionRows.length) await db.batch([db.insert(questions).values(questionRows), db.insert(questionOptions).values(optionRows), db.insert(questionRevisions).values(revisionRows), db.insert(questionRevisionOptions).values(revisionOptionRows), db.insert(auditLogs).values(auditRows), job]);
  else await db.batch([db.insert(questions).values(questionRows), db.insert(questionRevisions).values(revisionRows), db.insert(auditLogs).values(auditRows), job]);
  return { id: jobId, status: "IMPORTED" as const, totalRows: inputs.length, importedRows: inputs.length, issues: [] };
}
