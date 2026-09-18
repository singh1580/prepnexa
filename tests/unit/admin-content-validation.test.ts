import { describe, expect, it } from "vitest";
import { contentConflict, isUniqueViolation } from "../../src/features/admin-content/errors";
import { CONTENT_PERMISSIONS, hasAnyContentPermission } from "../../src/features/admin-content/permissions";
import { examInputSchema, subjectInputSchema, topicInputSchema } from "../../src/features/admin-content/validation";

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
});
