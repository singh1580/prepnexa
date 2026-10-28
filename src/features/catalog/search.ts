export type CatalogSearchRecord = {
  name: string;
  description: string | null;
  syllabus: string | null;
  subjects: string[];
  pricePaise: number;
};

export function matchesCatalogQuery(
  product: CatalogSearchRecord,
  rawQuery: string,
) {
  const query = rawQuery.trim().toLocaleLowerCase("en-IN");
  if (!query) return true;
  const priceTerms =
    product.pricePaise === 0 ? "free zero cost ₹0" : "paid";
  return `${product.name} ${product.description ?? ""} ${product.syllabus ?? ""} ${product.subjects.join(" ")} ${priceTerms}`
    .toLocaleLowerCase("en-IN")
    .includes(query);
}
