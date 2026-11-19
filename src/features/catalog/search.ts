export type CatalogSearchRecord = {
  slug?: string;
  name: string;
  description: string | null;
  syllabus: string | null;
  subjects: string[];
  language?: string;
  pricePaise: number;
};

function tokenize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLocaleLowerCase("en-IN")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesCatalogQuery(
  product: CatalogSearchRecord,
  rawQuery: string,
) {
  const queryTokens = tokenize(rawQuery);
  if (!queryTokens.length) return true;
  const priceTerms =
    product.pricePaise === 0 ? "free zero cost ₹0" : "paid";
  const searchableTokens = tokenize(
    `${product.slug ?? ""} ${product.name} ${product.description ?? ""} ${product.syllabus ?? ""} ${product.subjects.join(" ")} ${product.language ?? ""} ${priceTerms}`,
  );

  return queryTokens.every((queryToken) =>
    searchableTokens.some(
      (candidate) =>
        candidate === queryToken ||
        (queryToken.length >= 4 && candidate.startsWith(queryToken)),
    ),
  );
}
