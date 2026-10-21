import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("unregistered GST safeguards", () => {
  it("creates new orders without tax in both database checkout paths", () => {
    const repository = source("src/features/commerce/repository.ts");
    expect(repository).not.toMatch(/floor\([^\n]*\.18/);
    expect(repository).toContain("end,subtotal,discount,0,subtotal-discount");
    expect(repository).toContain("end,subtotal,0,0,subtotal,currency");
    expect(repository).toContain("tax_paise>0");
    expect(repository).toContain("GST_COLLECTION_DISABLED");
  });

  it("does not present new checkout pricing as GST-inclusive or issue a tax invoice", () => {
    const checkout = source("src/features/commerce/ui/cart-workflow.tsx");
    const packagePage = source("src/app/(public)/packages/[slug]/page.tsx");
    const receipt = source("src/app/(workspace)/invoice/[id]/page.tsx");
    expect(checkout).not.toContain("GST (18%)");
    expect(checkout).not.toContain("Taxable value");
    expect(packagePage).not.toContain("applicable GST");
    expect(receipt).toContain("Payment receipt");
    expect(receipt).toContain("It is not a GST tax invoice.");
    expect(receipt).not.toContain("INV-");
  });
});
