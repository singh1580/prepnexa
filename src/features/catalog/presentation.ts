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
