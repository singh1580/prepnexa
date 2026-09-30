import { describe, expect, it } from "vitest";
import { contentConflict, isUniqueViolation } from "../../src/features/admin-content/errors";
import { CONTENT_PERMISSIONS, hasAnyContentPermission } from "../../src/features/admin-content/permissions";
import { questionInputSchema } from "../../src/features/admin-content/validation";

describe("admin content policy and validation", () => {
  it("shows content navigation only for active content permissions", () => {
    expect(hasAnyContentPermission([CONTENT_PERMISSIONS.createQuestions])).toBe(true);
    expect(hasAnyContentPermission([CONTENT_PERMISSIONS.manageMaterials])).toBe(true);
    expect(hasAnyContentPermission(["profile.read.self"])).toBe(false);
  });

  it("recognises nested PostgreSQL uniqueness errors", () => {
    expect(isUniqueViolation({ cause: { code: "23505" } })).toBe(true);
    expect(isUniqueViolation({ cause: { code: "23503" } })).toBe(false);
    expect(contentConflict("Duplicate").status).toBe(409);
  });

  it("validates answer rules for every question type", () => {
    const base = { stem: "What is ten plus ten?", explanation: "Basic addition", marks: 1, negativeMarks: 0, difficulty: "EASY" as const, numericAnswer: null, numericTolerance: 0, acceptedAnswers: [], caseSensitive: false };
    const options = [{ stableKey: "A", body: "20", isCorrect: true, sortOrder: 0 }, { stableKey: "B", body: "30", isCorrect: false, sortOrder: 1 }, { stableKey: "C", body: "40", isCorrect: false, sortOrder: 2 }, { stableKey: "D", body: "50", isCorrect: false, sortOrder: 3 }];
    expect(questionInputSchema.safeParse({ ...base, type: "SINGLE_CHOICE", options }).success).toBe(true);
    expect(questionInputSchema.safeParse({ ...base, type: "SINGLE_CHOICE", options: options.map((option) => ({ ...option, isCorrect: true })) }).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...base, type: "NUMERIC", options: [], numericAnswer: 20 }).success).toBe(true);
    expect(questionInputSchema.safeParse({ ...base, type: "TEXT", options: [], acceptedAnswers: [] }).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...base, type: "TEXT", options: [], acceptedAnswers: ["twenty"] }).success).toBe(true);
  });
});
