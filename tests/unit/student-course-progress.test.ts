import { describe, expect, it } from "vitest";
import { courseProgress } from "../../src/features/student-courses/progress";

describe("package progress", () => {
  it("requires both a completed test and an opened resource before showing 100%", () => {
    expect(courseProgress({ testCount: 1, completedTests: 1, materialCount: 2, viewedMaterialCount: 1 })).toBe(67);
    expect(courseProgress({ testCount: 1, completedTests: 1, materialCount: 2, viewedMaterialCount: 2 })).toBe(100);
  });

  it("handles empty packages and caps progress at the available content", () => {
    expect(courseProgress({ testCount: 0, completedTests: 0, materialCount: 0, viewedMaterialCount: 0 })).toBe(0);
    expect(courseProgress({ testCount: 1, completedTests: 3, materialCount: 1, viewedMaterialCount: 4 })).toBe(100);
  });
});
