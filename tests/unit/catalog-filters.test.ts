import { describe, expect, it } from "vitest";
import {
  filterAndSortCatalog,
  normalizeCatalogFilters,
} from "@/features/catalog/filters";

const base = {
  description: null,
  syllabus: null,
  subjects: ["Advanced Aptitude"],
  language: "ENGLISH",
  materialTypes: ["PDF"],
  materialCount: 1,
  testCount: 0,
  rating: 0,
  reviewCount: 0,
};

const products = [
  {
    ...base,
    slug: "advanced-aptitude-dsa-coding-mastery",
    name: "Advanced Aptitude & DSA Coding Mastery",
    pricePaise: 9_900,
    createdAt: "2026-11-03T00:00:00.000Z",
    testCount: 6,
    reviewCount: 3,
  },
  {
    ...base,
    slug: "hindi-reasoning",
    name: "Hindi Reasoning",
    subjects: ["Reasoning Ability"],
    language: "HINDI",
    materialTypes: ["VIDEO"],
    pricePaise: 200_000,
    createdAt: "2026-11-04T00:00:00.000Z",
  },
  {
    ...base,
    slug: "bilingual-bundle",
    name: "Bilingual Placement Bundle",
    subjects: ["Placement Interview Prep"],
    language: "BILINGUAL",
    materialTypes: ["FILE", "PDF"],
    materialCount: 2,
    testCount: 2,
    pricePaise: 1_000_000,
    createdAt: "2026-11-05T00:00:00.000Z",
  },
  {
    ...base,
    slug: "premium-package",
    name: "Premium Package",
    pricePaise: 1_000_001,
    createdAt: "2026-11-02T00:00:00.000Z",
  },
];

const filters = (overrides: Parameters<typeof normalizeCatalogFilters>[0] = {}) =>
  normalizeCatalogFilters(overrides);

describe("catalog filters", () => {
  it("combines normalized search, subject, language and format filters", () => {
    const rows = filterAndSortCatalog(
      products,
      filters({
        q: "advance aptitude",
        subjects: ["Advanced Aptitude"],
        languages: ["ENGLISH"],
        formats: ["bundle"],
      }),
    );

    expect(rows.map((product) => product.slug)).toEqual([
      "advanced-aptitude-dsa-coding-mastery",
    ]);
  });

  it("uses non-overlapping price boundaries", () => {
    expect(
      filterAndSortCatalog(products, filters({ prices: ["under2000"] })),
    ).toHaveLength(1);
    expect(
      filterAndSortCatalog(products, filters({ prices: ["2000-5000"] })).map(
        (product) => product.pricePaise,
      ),
    ).toEqual([200_000]);
    expect(
      filterAndSortCatalog(
        products,
        filters({ prices: ["5000-10000"] }),
      ).map((product) => product.pricePaise),
    ).toEqual([1_000_000]);
    expect(
      filterAndSortCatalog(products, filters({ prices: ["above10000"] })).map(
        (product) => product.pricePaise,
      ),
    ).toEqual([1_000_001]);
  });

  it("supports OR within a filter group and AND between groups", () => {
    const rows = filterAndSortCatalog(
      products,
      filters({
        languages: ["HINDI", "BILINGUAL"],
        formats: ["video", "bundle"],
      }),
    );

    expect(rows.map((product) => product.slug).sort()).toEqual([
      "bilingual-bundle",
      "hindi-reasoning",
    ]);
  });

  it("sorts by popularity, newest and price", () => {
    expect(
      filterAndSortCatalog(products, filters()).map((product) => product.slug),
    ).toEqual([
      "advanced-aptitude-dsa-coding-mastery",
      "bilingual-bundle",
      "hindi-reasoning",
      "premium-package",
    ]);
    expect(
      filterAndSortCatalog(products, filters({ sort: "latest" }))[0]?.slug,
    ).toBe("bilingual-bundle");
    expect(
      filterAndSortCatalog(products, filters({ sort: "price-low" }))[0]?.slug,
    ).toBe("advanced-aptitude-dsa-coding-mastery");
    expect(
      filterAndSortCatalog(products, filters({ sort: "price-high" }))[0]?.slug,
    ).toBe("premium-package");
  });

  it("ignores unsupported URL filter and sort values", () => {
    expect(
      normalizeCatalogFilters({
        sort: "broken",
        prices: ["broken"],
        languages: ["KLINGON"],
        formats: ["zip"],
      }),
    ).toMatchObject({
      sort: "popularity",
      prices: [],
      languages: [],
      formats: [],
    });
  });
});
