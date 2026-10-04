import { describe, expect, it } from "vitest";
import {
  formatIndiaDate,
  formatIndiaDateTime,
  indiaDateTimeLocalToIso,
  toDate,
  toIndiaDateTimeLocal,
  toIsoString,
  toOptionalIsoString,
} from "@/lib/date-time";

describe("date-time normalization", () => {
  it("normalizes Date, string and epoch inputs", () => {
    const iso = "2026-10-04T10:30:00.000Z";
    expect(toIsoString(new Date(iso))).toBe(iso);
    expect(toIsoString(iso)).toBe(iso);
    expect(toDate(Date.parse(iso)).toISOString()).toBe(iso);
  });

  it("preserves missing optional dates", () => {
    expect(toOptionalIsoString(null)).toBeNull();
    expect(toOptionalIsoString(undefined)).toBeNull();
  });

  it("rejects invalid dates instead of returning misleading output", () => {
    expect(() => toIsoString("not-a-date")).toThrow("Invalid date value.");
  });

  it("formats browser-visible dates in a deterministic India timezone", () => {
    const iso = "2026-10-04T20:45:00.000Z";
    expect(formatIndiaDate(iso)).toBe("5 Oct 2026");
    expect(formatIndiaDateTime(iso)).toContain("5 Oct 2026");
    expect(toIndiaDateTimeLocal(iso)).toBe("2026-10-05T02:15");
    expect(indiaDateTimeLocalToIso("2026-10-05T02:15")).toBe(iso);
  });
});
