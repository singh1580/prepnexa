import { describe, expect, it } from "vitest";
import { parseQuestionCsv, questionCsvTemplate, testQuestionCsvTemplate, QUESTION_CSV_HEADERS } from "../../src/features/admin-imports/question-csv";

const topicId = crypto.randomUUID();
function csv(row: string) { return `${QUESTION_CSV_HEADERS.join(",")}\n${row}`; }
describe("question CSV import validation", () => {
  it("imports a test template using the selected topic without spreadsheet IDs", () => {
    const result = parseQuestionCsv(testQuestionCsvTemplate(), topicId);
    expect(result.issues).toEqual([]);
    expect(result.questions[0].topicId).toBe(topicId);
    expect(testQuestionCsvTemplate().split("\n")[0]).not.toContain("topicId");
  });
  it("uses the selected test topic even when a legacy file contains another topic", () => {
    const result = parseQuestionCsv(questionCsvTemplate(crypto.randomUUID()), topicId);
    expect(result.issues).toEqual([]);
    expect(result.questions[0].topicId).toBe(topicId);
  });
  it("keeps row errors and valid rows separate for an all-or-nothing test import", () => {
    const csv = testQuestionCsvTemplate();
    const invalidRow = csv.split("\n")[1].replace(",B,", ",A|B,");
    const result = parseQuestionCsv(`${csv}\n${invalidRow}`, topicId);
    expect(result.totalRows).toBe(2);
    expect(result.questions).toHaveLength(1);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ rowNumber: 3 })]));
  });
  it("generates a valid starter row for an existing topic", () => {
    const result = parseQuestionCsv(questionCsvTemplate(topicId));
    expect(result.issues).toEqual([]);
    expect(result.questions[0]).toMatchObject({ topicId, type: "SINGLE_CHOICE" });
  });
  it("parses quoted choice questions and correct option keys", () => {
    const result = parseQuestionCsv(csv(`${topicId},SINGLE_CHOICE,"What is 2, plus 2?",Explanation,1,0,EASY,3,4,5,6,B,,,,false`));
    expect(result.issues).toEqual([]); expect(result.questions[0]).toMatchObject({ topicId, type: "SINGLE_CHOICE", stem: "What is 2, plus 2?" }); expect(result.questions[0]?.options).toHaveLength(4); expect(result.questions[0]?.options[1]).toMatchObject({ stableKey: "B", body: "4", isCorrect: true });
  });
  it("rejects the entire input when a row is invalid", () => {
    const result = parseQuestionCsv(csv(`${topicId},MULTIPLE_CHOICE,Too short,,1,0,EASY,One,Two,,,A,,,,false`));
    expect(result.questions).toHaveLength(0); expect(result.issues.length).toBeGreaterThan(0); expect(result.issues[0]?.rowNumber).toBe(2);
  });
  it("limits import size and requires every header", () => {
    expect(parseQuestionCsv("topicId,type\n1,TEXT").issues.some((issue) => issue.code === "MISSING_HEADER")).toBe(true);
    const row = `${topicId},TEXT,A sufficiently long question,,1,0,MEDIUM,,,,,,,,answer,false`; expect(parseQuestionCsv(`${QUESTION_CSV_HEADERS.join(",")}\n${Array.from({ length: 501 }, () => row).join("\n")}`).issues[0]?.code).toBe("TOO_MANY_ROWS");
  });
  it("rejects rows with missing or extra columns", () => {
    expect(parseQuestionCsv(`${QUESTION_CSV_HEADERS.join(",")}\n${topicId},TEXT,Only three columns`).issues[0]?.code).toBe("COLUMN_COUNT");
  });
});
