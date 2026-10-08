import { describe, expect, it } from "vitest";
import { formatAccessDuration, formatCount, normaliseProductName } from "@/features/catalog/presentation";

describe("catalog presentation", () => {
  it("uses grammatically correct count labels", () => {
    expect(formatCount(1, "test")).toBe("1 test");
    expect(formatCount(2, "test")).toBe("2 tests");
    expect(formatCount(0, "resource")).toBe("0 resources");
  });

  it("formats access periods without reporting years as months", () => {
    expect(formatAccessDuration(1)).toBe("1 day");
    expect(formatAccessDuration(30)).toBe("1 month");
    expect(formatAccessDuration(365)).toBe("1 year");
    expect(formatAccessDuration(730)).toBe("2 years");
  });

  it("makes machine-like product names readable without inventing content", () => {
    expect(normaliseProductName("first_testing  package")).toBe("first testing package");
  });
});
