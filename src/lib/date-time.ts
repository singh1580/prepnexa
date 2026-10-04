export type DateInput = Date | string | number;

export function toDate(value: DateInput) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError("Invalid date value.");
  return date;
}

export function toIsoString(value: DateInput) {
  return toDate(value).toISOString();
}

export function toOptionalIsoString(value: DateInput | null | undefined) {
  return value == null ? null : toIsoString(value);
}

const INDIA_TIME_ZONE = "Asia/Kolkata";

export function formatIndiaDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: INDIA_TIME_ZONE,
  }).format(toDate(value));
}

export function formatIndiaDateTime(value: DateInput) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: INDIA_TIME_ZONE,
  }).format(toDate(value));
}

/** Formats an instant for an India-local datetime-local form control. */
export function toIndiaDateTimeLocal(value: DateInput | null | undefined) {
  if (value == null) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(toDate(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function indiaDateTimeLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new TypeError("Invalid India-local date and time.");
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(+year, +month - 1, +day, +hour, +minute) - 330 * 60_000,
  ).toISOString();
}
