import { createHash } from "node:crypto";
import { logger } from "@/lib/logger";
import { parseQuestionCsv } from "./question-csv";
import { findExistingTopicIds, importQuestionRows, recordInvalidImport } from "./repository";

export async function importQuestionsCsv(csv: string, actor: { userId: string; requestId: string }) {
  const parsed = parseQuestionCsv(csv); const objectKey = `inline-sha256:${createHash("sha256").update(csv).digest("hex")}`; const context = { actorUserId: actor.userId, requestId: actor.requestId, objectKey };
  if (!parsed.issues.length) { const existing = await findExistingTopicIds([...new Set(parsed.questions.map((question) => question.topicId))]); parsed.questions.forEach((question, index) => { if (!existing.has(question.topicId)) parsed.issues.push({ rowNumber: index + 2, field: "topicId", code: "UNKNOWN_TOPIC", message: "Topic does not exist.", rawValue: question.topicId }); }); }
  const result = parsed.issues.length ? await recordInvalidImport(parsed.totalRows, parsed.issues, context) : await importQuestionRows(parsed.questions, context);
  logger.info({ requestId: actor.requestId, module: "admin-imports", action: "questions_csv", actorUserId: actor.userId, status: result.status, totalRows: result.totalRows }, "Question import completed"); return result;
}
