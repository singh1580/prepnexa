import { describe, expect, it } from "vitest";
import { scoreAttempt, scoreQuestion, type ScoringQuestion } from "../../src/features/student-results/scoring";

const base: ScoringQuestion = { questionId: "q", sectionId: "s", topicId: "t", type: "SINGLE_CHOICE", marks: "2.00", negativeMarks: "0.50", answerConfig: {}, options: [{ id: "a", isCorrect: false }, { id: "b", isCorrect: true }], selectedOptionIds: [], textAnswer: null, numericAnswer: null };
describe("student result scoring", () => {
  it("scores exact choices and applies negative marks only to attempted answers", () => {
    expect(scoreQuestion({ ...base, selectedOptionIds: ["b"] })).toMatchObject({ answered: true, correct: true, awardedMarks: "2.00" });
    expect(scoreQuestion({ ...base, selectedOptionIds: ["a"] })).toMatchObject({ answered: true, correct: false, awardedMarks: "-0.50" });
    expect(scoreQuestion(base)).toMatchObject({ answered: false, correct: false, awardedMarks: "0.00" });
  });
  it("requires an exact multiple-choice set without partial credit", () => {
    const multiple = { ...base, type: "MULTIPLE_CHOICE" as const, options: [{ id: "a", isCorrect: true }, { id: "b", isCorrect: true }, { id: "c", isCorrect: false }] };
    expect(scoreQuestion({ ...multiple, selectedOptionIds: ["b", "a"] }).correct).toBe(true);
    expect(scoreQuestion({ ...multiple, selectedOptionIds: ["a"] }).correct).toBe(false);
  });
  it("honours numeric tolerance and text case policy", () => {
    expect(scoreQuestion({ ...base, type: "NUMERIC", answerConfig: { value: 10, tolerance: 0.1 }, numericAnswer: "10.09" }).correct).toBe(true);
    expect(scoreQuestion({ ...base, type: "TEXT", answerConfig: { acceptedAnswers: ["New Delhi"], caseSensitive: false }, textAnswer: " new delhi " }).correct).toBe(true);
    expect(scoreQuestion({ ...base, type: "TEXT", answerConfig: { acceptedAnswers: ["New Delhi"], caseSensitive: true }, textAnswer: "new delhi" }).correct).toBe(false);
  });
  it("produces exact total, section and topic aggregates", () => {
    const result = scoreAttempt([{ ...base, selectedOptionIds: ["b"] }, { ...base, questionId: "q2", topicId: "t2", selectedOptionIds: ["a"] }, { ...base, questionId: "q3" }]);
    expect(result).toMatchObject({ score: "1.50", maxScore: "6.00", correctCount: 1, incorrectCount: 1, unansweredCount: 1, attemptedCount: 2 });
    expect(result.sections).toHaveLength(1); expect(result.topics).toHaveLength(2);
  });
});
