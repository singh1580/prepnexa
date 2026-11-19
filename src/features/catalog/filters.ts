import {
  matchesCatalogQuery,
  type CatalogSearchRecord,
} from "@/features/catalog/search";

export const CATALOG_SORTS = [
  "popularity",
  "latest",
  "price-low",
  "price-high",
] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export type CatalogFilterState = {
  q: string;
  sort: CatalogSort;
  subjects: string[];
  prices: string[];
  languages: string[];
  formats: string[];
};

export type CatalogFilterRecord = CatalogSearchRecord & {
  createdAt: Date | string;
  language: string;
  materialTypes: string[];
  materialCount: number;
  testCount: number;
  rating: number;
  reviewCount: number;
};

const PRICE_FILTERS = new Set([
  "under2000",
  "2000-5000",
  "5000-10000",
  "above10000",
]);
const LANGUAGE_FILTERS = new Set(["ENGLISH", "HINDI", "BILINGUAL"]);
const FORMAT_FILTERS = new Set(["pdf", "video", "notes", "tests", "bundle"]);

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function allowed(values: string[], accepted: Set<string>) {
  return uniqueNonEmpty(values).filter((value) => accepted.has(value));
}

export function normalizeCatalogSort(value: string | undefined): CatalogSort {
  return CATALOG_SORTS.includes(value as CatalogSort)
    ? (value as CatalogSort)
    : "popularity";
}

export function normalizeCatalogFilters(input: {
  q?: string;
  sort?: string;
  subjects?: string[];
  prices?: string[];
  languages?: string[];
  formats?: string[];
}): CatalogFilterState {
  return {
    q: input.q?.trim() ?? "",
    sort: normalizeCatalogSort(input.sort),
    subjects: uniqueNonEmpty(input.subjects ?? []),
    prices: allowed(input.prices ?? [], PRICE_FILTERS),
    languages: allowed(input.languages ?? [], LANGUAGE_FILTERS),
    formats: allowed(input.formats ?? [], FORMAT_FILTERS),
  };
}

function matchesPrice(pricePaise: number, prices: string[]) {
  return (
    !prices.length ||
    prices.some((range) => {
      if (range === "under2000") return pricePaise < 200_000;
      if (range === "2000-5000") {
        return pricePaise >= 200_000 && pricePaise < 500_000;
      }
      if (range === "5000-10000") {
        return pricePaise >= 500_000 && pricePaise <= 1_000_000;
      }
      return range === "above10000" && pricePaise > 1_000_000;
    })
  );
}

function matchesFormat(product: CatalogFilterRecord, formats: string[]) {
  return (
    !formats.length ||
    formats.some((format) => {
      if (format === "pdf") return product.materialTypes.includes("PDF");
      if (format === "video") return product.materialTypes.includes("VIDEO");
      if (format === "notes") return product.materialTypes.includes("FILE");
      if (format === "tests") return product.testCount > 0;
      return (
        format === "bundle" &&
        product.materialCount > 0 &&
        product.testCount > 0
      );
    })
  );
}

function popularity(product: CatalogFilterRecord) {
  return product.reviewCount * 10 + product.rating + product.testCount;
}

export function filterAndSortCatalog<T extends CatalogFilterRecord>(
  products: readonly T[],
  filters: CatalogFilterState,
) {
  const rows = products.filter(
    (product) =>
      matchesCatalogQuery(product, filters.q) &&
      (!filters.subjects.length ||
        filters.subjects.some((subject) =>
          product.subjects.includes(subject),
        )) &&
      matchesPrice(product.pricePaise, filters.prices) &&
      (!filters.languages.length ||
        filters.languages.includes(product.language)) &&
      matchesFormat(product, filters.formats),
  );

  return rows.sort((a, b) => {
    if (filters.sort === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (filters.sort === "price-low") return a.pricePaise - b.pricePaise;
    if (filters.sort === "price-high") return b.pricePaise - a.pricePaise;
    return popularity(b) - popularity(a);
  });
}
