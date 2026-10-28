import { describe, expect, it } from "vitest";
import { matchesCatalogQuery } from "@/features/catalog/search";

const product = {
  name: "Foundation exam package",
  description: "Practice for competitive exams",
  syllabus: "Reasoning and aptitude",
  subjects: ["Mathematics", "English"],
  pricePaise: 0,
};

describe("catalog search", () => {
  it("matches package metadata and subjects without case sensitivity", () => {
    expect(matchesCatalogQuery(product, "FOUNDATION")).toBe(true);
    expect(matchesCatalogQuery(product, "mathematics")).toBe(true);
    expect(matchesCatalogQuery(product, "reasoning")).toBe(true);
  });

  it("treats free and zero-cost queries as price semantics", () => {
    expect(matchesCatalogQuery(product, "free")).toBe(true);
    expect(matchesCatalogQuery(product, "zero cost")).toBe(true);
    expect(matchesCatalogQuery(product, "₹0")).toBe(true);
    expect(matchesCatalogQuery({ ...product, pricePaise: 100 }, "free")).toBe(
      false,
    );
  });
});
