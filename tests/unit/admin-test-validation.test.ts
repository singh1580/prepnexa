import { describe, expect, it } from "vitest";
import { scheduleInputSchema, sectionInputSchema, testInputSchema } from "../../src/features/admin-tests/validation";

describe("admin test validation", () => {
  it("accepts bounded test and section configuration", () => {
    expect(testInputSchema.safeParse({ examId: crypto.randomUUID(), title: "Mock test 01", mode: "MOCK", durationMinutes: 60, instructions: "", maxAttempts: 1, shuffleQuestions: true, shuffleOptions: true }).success).toBe(true);
    expect(sectionInputSchema.safeParse({ title: "Aptitude", durationMinutes: null, sortOrder: 0 }).success).toBe(true);
    expect(sectionInputSchema.safeParse({ title: "A", durationMinutes: 0, sortOrder: -1 }).success).toBe(false);
  });

  it.each(["LIVE", "PRACTICE"])("defers %s creation", (mode) => {
    expect(testInputSchema.safeParse({ examId: crypto.randomUUID(), title: "Test", mode, durationMinutes: 60, maxAttempts: 1 }).success).toBe(false);
  });

  it("accepts saved categories and rejects unknown categories", () => {
    const base = { examId: crypto.randomUUID(), title: "Practice set", mode: "MOCK", durationMinutes: 30, maxAttempts: 1 };
    for (const category of ["FULL_MOCK", "SUBJECT_TEST", "TOPIC_SET", null]) {
      expect(testInputSchema.parse({ ...base, category }).category).toBe(category);
    }
    expect(testInputSchema.safeParse({ ...base, category: "LIVE" }).success).toBe(false);
    expect(testInputSchema.parse(base).category).toBeNull();
  });

  it("rejects inverted live windows and early result release", () => {
    const base = { startsAt: "2030-01-01T10:00:00.000Z", endsAt: "2030-01-01T11:00:00.000Z", lateJoinMinutes: 15, resultReleaseAt: null, rankingEnabled: false, cohortKey: "" };
    expect(scheduleInputSchema.safeParse(base).success).toBe(true);
    expect(scheduleInputSchema.safeParse({ ...base, endsAt: "2030-01-01T09:00:00.000Z" }).success).toBe(false);
    expect(scheduleInputSchema.safeParse({ ...base, resultReleaseAt: "2030-01-01T10:30:00.000Z" }).success).toBe(false);
  });
});
