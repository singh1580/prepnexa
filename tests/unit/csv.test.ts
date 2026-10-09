import { describe, expect, it } from "vitest";
import { csvCell } from "../../src/lib/csv";

describe("spreadsheet-safe CSV cells", () => {
  it("quotes commas, newlines and embedded quotes", () => {
    expect(csvCell('A, "B"\nC')).toBe('"A, ""B""\nC"');
  });

  it("neutralizes formulas even after leading whitespace", () => {
    for (const value of ["=1+1", "+SUM(A1:A2)", "-1+2", "@SUM(1)", "\t=1+1"])
      expect(csvCell(value)).toBe(`"'${value}"`);
  });
});
