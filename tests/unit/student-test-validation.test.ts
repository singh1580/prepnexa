import { describe, expect, it } from "vitest";
import { answerInputSchema, normalizeAnswerForQuestion } from "../../src/features/student-tests/validation";

const optionA = crypto.randomUUID();
const optionB = crypto.randomUUID();
const base = { selectedOptionIds: [] as string[], textAnswer: null, numericAnswer: null, markedForReview: false, version: 0 };

describe("student attempt answer validation", () => {
  it("accepts clear answers and a valid optimistic version", () => {
    expect(answerInputSchema.parse(base)).toEqual(base);
    expect(answerInputSchema.safeParse({ ...base, version: -1 }).success).toBe(false);
  });

  it("rejects duplicate, foreign, and multiple single-choice options", () => {
    expect(answerInputSchema.safeParse({ ...base, selectedOptionIds: [optionA, optionA] }).success).toBe(false);
    expect(() => normalizeAnswerForQuestion("SINGLE_CHOICE", { ...base, selectedOptionIds: [optionA, optionB] }, [optionA, optionB])).toThrow("Select one option");
    expect(() => normalizeAnswerForQuestion("SINGLE_CHOICE", { ...base, selectedOptionIds: [crypto.randomUUID()] }, [optionA])).toThrow("not part of this question");
  });

  it("keeps only the answer shape allowed by each question type", () => {
    expect(normalizeAnswerForQuestion("MULTIPLE_CHOICE", { ...base, selectedOptionIds: [optionA, optionB] }, [optionA, optionB])).toEqual({ selectedOptionIds: [optionA, optionB], textAnswer: null, numericAnswer: null });
    expect(normalizeAnswerForQuestion("NUMERIC", { ...base, numericAnswer: "-12.5" }, [])).toEqual({ selectedOptionIds: [], textAnswer: null, numericAnswer: "-12.5" });
    expect(normalizeAnswerForQuestion("TEXT", { ...base, textAnswer: "Working shown" }, [])).toEqual({ selectedOptionIds: [], textAnswer: "Working shown", numericAnswer: null });
  });

  it("rejects malformed numeric answers and mixed answer modes", () => {
    expect(answerInputSchema.safeParse({ ...base, numericAnswer: "12x" }).success).toBe(false);
    expect(() => normalizeAnswerForQuestion("NUMERIC", { ...base, selectedOptionIds: [optionA], numericAnswer: "12" }, [optionA])).toThrow("numeric answer");
    expect(() => normalizeAnswerForQuestion("TEXT", { ...base, textAnswer: "Answer", numericAnswer: "2" }, [])).toThrow("written answer");
  });
});
