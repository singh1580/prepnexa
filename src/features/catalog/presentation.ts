export function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? singular : plural}`;
}

export function formatAccessDuration(days: number) {
  if (days < 30) return formatCount(days, "day");
  if (days < 365) return formatCount(Math.max(1, Math.round(days / 30)), "month");
  return formatCount(Math.max(1, Math.round(days / 365)), "year");
}

export function normaliseProductName(name: string) {
  return name.replaceAll("_", " ").replace(/\s+/g, " ").trim();
}

function comparableCopy(value: string) {
  return value.toLocaleLowerCase("en-IN").replace(/[^a-z0-9]+/g, "");
}

export function meaningfulProductDescription(
  description: string | null | undefined,
  name: string,
  slug: string,
  fallback: string,
) {
  const copy = description?.trim();
  if (!copy) return fallback;

  const normalisedCopy = comparableCopy(copy);
  const repeatsIdentity = [name, normaliseProductName(name), slug].some(
    (identity) => comparableCopy(identity) === normalisedCopy,
  );

  return repeatsIdentity ? fallback : copy;
}
