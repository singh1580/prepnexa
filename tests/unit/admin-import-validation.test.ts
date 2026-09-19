import { describe, expect, it } from "vitest";
import { parseQuestionCsv, QUESTION_CSV_HEADERS } from "../../src/features/admin-imports/question-csv";

const topicId = crypto.randomUUID();
function csv(row: string) { return `${QUESTION_CSV_HEADERS.join(",")}\n${row}`; }
describe("question CSV import validation", () => {
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
