import { ZodError } from "zod";
import { questionInputSchema } from "@/features/admin-content/validation";
import type { QuestionInput } from "@/features/admin-content/repository";

export const QUESTION_CSV_HEADERS = ["stem", "optionA", "optionB", "optionC", "optionD", "correctOptions", "explanation"] as const;
export type ImportIssue = { rowNumber: number; field: string | null; code: string; message: string; rawValue: string | null };

function rowsFromCsv(csv: string) {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') { if (quoted && csv[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && csv[index + 1] === "\n") index += 1; row.push(value); if (row.some((field) => field.trim())) rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(value); if (row.some((field) => field.trim())) rows.push(row); return rows;
}

export function parseQuestionCsv(csv: string): { questions: QuestionInput[]; issues: ImportIssue[]; totalRows: number } {
  if (csv.length > 1_000_000) return { questions: [], issues: [{ rowNumber: 1, field: null, code: "FILE_TOO_LARGE", message: "CSV must be 1 MB or smaller.", rawValue: null }], totalRows: 0 };
  let rows: string[][]; try { rows = rowsFromCsv(csv.replace(/^\uFEFF/, "")); } catch (error) { return { questions: [], issues: [{ rowNumber: 1, field: null, code: "INVALID_CSV", message: error instanceof Error ? error.message : "CSV could not be parsed.", rawValue: null }], totalRows: 0 }; }
  if (rows.length < 2) return { questions: [], issues: [{ rowNumber: 1, field: null, code: "EMPTY_IMPORT", message: "Add a header and at least one question row.", rawValue: null }], totalRows: 0 };
  const headers = rows[0].map((header) => header.trim()); const missing = QUESTION_CSV_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) return { questions: [], issues: missing.map((field) => ({ rowNumber: 1, field, code: "MISSING_HEADER", message: `Missing required header: ${field}.`, rawValue: null })), totalRows: rows.length - 1 };
  if (rows.length - 1 > 500) return { questions: [], issues: [{ rowNumber: 1, field: null, code: "TOO_MANY_ROWS", message: "Import at most 500 questions at a time.", rawValue: null }], totalRows: rows.length - 1 };
  const questions: QuestionInput[] = []; const issues: ImportIssue[] = [];
  rows.slice(1).forEach((values, offset) => {
    const rowNumber = offset + 2; const record = Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()]));
    if (values.length !== headers.length) { issues.push({ rowNumber, field: null, code: "COLUMN_COUNT", message: `Expected ${headers.length} columns but found ${values.length}.`, rawValue: null }); return; }
    const optionKeys = ["A", "B", "C", "D"] as const; const correct = new Set((record.correctOptions ?? "").split("|").map((key) => key.trim().toUpperCase()).filter(Boolean));
    const candidate = { type: "SINGLE_CHOICE", stem: record.stem, explanation: record.explanation, marks: 1, negativeMarks: 0, difficulty: "MEDIUM", options: optionKeys.flatMap((key, sortOrder) => record[`option${key}`] ? [{ stableKey: key, body: record[`option${key}`], isCorrect: correct.has(key), sortOrder }] : []), numericAnswer: null, numericTolerance: 0, acceptedAnswers: [], caseSensitive: false };
    try { questions.push(questionInputSchema.parse(candidate)); }
    catch (error) { if (error instanceof ZodError) for (const issue of error.issues) { const field = issue.path.join(".") || null; issues.push({ rowNumber, field, code: issue.code, message: issue.message, rawValue: field && field in record ? record[field] : null }); } else issues.push({ rowNumber, field: null, code: "INVALID_ROW", message: "Row could not be validated.", rawValue: null }); }
  });
  return { questions, issues, totalRows: rows.length - 1 };
}

export function questionCsvTemplate() {
  return `${QUESTION_CSV_HEADERS.join(",")}\n"What is 2 + 2?",3,4,5,6,B,"Two plus two equals four."`;
}
export const QUESTION_CSV_TEMPLATE = questionCsvTemplate();

// Test imports stay intentionally compact so admins can prepare them in any spreadsheet app.
export const testQuestionCsvTemplate = questionCsvTemplate;
