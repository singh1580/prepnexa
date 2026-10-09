/** Quote fields and keep user-provided values from becoming spreadsheet formulas. */
export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
