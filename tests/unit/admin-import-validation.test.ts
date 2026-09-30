import { describe, expect, it } from "vitest";
import { parseQuestionCsv, questionCsvTemplate, testQuestionCsvTemplate, QUESTION_CSV_HEADERS } from "../../src/features/admin-imports/question-csv";

function csv(row: string) { return `${QUESTION_CSV_HEADERS.join(",")}\n${row}`; }

describe("question CSV import validation", () => {
  it("imports the compact spreadsheet template without internal IDs", () => {
    const result = parseQuestionCsv(testQuestionCsvTemplate());
    expect(result.issues).toEqual([]);
    expect(result.questions[0]).toMatchObject({ type: "SINGLE_CHOICE", stem: "What is 2 + 2?" });
    expect(testQuestionCsvTemplate().split("\n")[0]).toBe(QUESTION_CSV_HEADERS.join(","));
  });

  it("keeps row errors and valid rows separate", () => {
    const source = testQuestionCsvTemplate();
    const invalidRow = source.split("\n")[1]!.replace(",B,", ",A|B,");
    const result = parseQuestionCsv(`${source}\n${invalidRow}`);
    expect(result.totalRows).toBe(2);
    expect(result.questions).toHaveLength(1);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ rowNumber: 3 })]));
  });

  it("parses quoted questions and correct option keys", () => {
    const result = parseQuestionCsv(csv('"What is 2, plus 2?",3,4,5,6,B,Explanation'));
    expect(result.issues).toEqual([]);
    expect(result.questions[0]?.options[1]).toMatchObject({ stableKey: "B", body: "4", isCorrect: true });
  });

  it("limits import size and requires every header", () => {
    expect(parseQuestionCsv("stem,optionA\nQuestion,One").issues.some((issue) => issue.code === "MISSING_HEADER")).toBe(true);
    const row = "A sufficiently long question,One,Two,Three,Four,A,Explanation";
    expect(parseQuestionCsv(`${QUESTION_CSV_HEADERS.join(",")}\n${Array.from({ length: 501 }, () => row).join("\n")}`).issues[0]?.code).toBe("TOO_MANY_ROWS");
  });

  it("rejects rows with missing or extra columns", () => {
    expect(parseQuestionCsv(`${QUESTION_CSV_HEADERS.join(",")}\nOnly one column`).issues[0]?.code).toBe("COLUMN_COUNT");
    expect(questionCsvTemplate()).toBe(testQuestionCsvTemplate());
  });
});
