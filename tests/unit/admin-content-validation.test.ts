import { describe, expect, it } from "vitest";
import { contentConflict, isUniqueViolation } from "../../src/features/admin-content/errors";
import { CONTENT_PERMISSIONS, hasAnyContentPermission } from "../../src/features/admin-content/permissions";
import { examInputSchema, questionInputSchema, subjectInputSchema, topicInputSchema } from "../../src/features/admin-content/validation";

describe("admin content policy and validation", () => {
  it("shows content navigation only for content permissions", () => {
    expect(hasAnyContentPermission([CONTENT_PERMISSIONS.manageExams])).toBe(true);
    expect(hasAnyContentPermission([CONTENT_PERMISSIONS.reviewQuestions])).toBe(true);
    expect(hasAnyContentPermission(["profile.read.self"])).toBe(false);
  });

  it("accepts a safe exam and rejects unsafe slugs", () => {
    expect(examInputSchema.parse({ name: "  TCS NQT  ", slug: "tcs-nqt", description: "  Placement exam  " })).toEqual({ name: "TCS NQT", slug: "tcs-nqt", description: "Placement exam" });
    expect(() => examInputSchema.parse({ name: "TCS NQT", slug: "TCS NQT", description: "" })).toThrow();
    expect(() => examInputSchema.parse({ name: "TCS NQT", slug: "../tcs", description: "" })).toThrow();
  });

  it("coerces safe ordering and bounds taxonomy input", () => {
    expect(subjectInputSchema.parse({ name: "Aptitude", sortOrder: "2" })).toEqual({ name: "Aptitude", sortOrder: 2 });
    expect(topicInputSchema.safeParse({ name: "Percentages", sortOrder: -1 }).success).toBe(false);
  });

  it("recognises nested PostgreSQL uniqueness errors", () => {
    expect(isUniqueViolation({ cause: { code: "23505" } })).toBe(true);
    expect(isUniqueViolation({ cause: { code: "23503" } })).toBe(false);
    expect(contentConflict("Duplicate").status).toBe(409);
  });

  it("validates answer rules for every question type", () => {
    const base = { topicId: crypto.randomUUID(), stem: "What is ten plus ten?", explanation: "Basic addition", marks: 1, negativeMarks: 0, difficulty: "EASY" as const, numericAnswer: null, numericTolerance: 0, acceptedAnswers: [], caseSensitive: false };
    const options = [{ stableKey: "A", body: "20", isCorrect: true, sortOrder: 0 }, { stableKey: "B", body: "30", isCorrect: false, sortOrder: 1 }];
    expect(questionInputSchema.safeParse({ ...base, type: "SINGLE_CHOICE", options }).success).toBe(true);
    expect(questionInputSchema.safeParse({ ...base, type: "SINGLE_CHOICE", options: options.map((option) => ({ ...option, isCorrect: true })) }).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...base, type: "NUMERIC", options: [], numericAnswer: 20 }).success).toBe(true);
    expect(questionInputSchema.safeParse({ ...base, type: "TEXT", options: [], acceptedAnswers: [] }).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...base, type: "TEXT", options: [], acceptedAnswers: ["twenty"] }).success).toBe(true);
  });
});
