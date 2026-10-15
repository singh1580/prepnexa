import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive content integrity", () => {
  const css = readFileSync("src/app/styles.css", "utf8");
  const storefrontFixes = readFileSync("src/app/storefront-fixes.css", "utf8");
  const orders = readFileSync(
    "src/app/(workspace)/dashboard/orders/page.tsx",
    "utf8",
  );
  const reader = readFileSync(
    "src/app/(workspace)/library/[id]/page.tsx",
    "utf8",
  );

  it("keeps product tabs inside their mobile container", () => {
    expect(css).not.toContain(
      ".reference-product-tabs{margin-inline:-1.25rem;padding-inline:1.25rem}",
    );
    expect(css).toContain(".reference-product-tabs{position:static;display:flex;width:100%");
  });

  it("limits horizontal catalogue cards to the catalogue grid", () => {
    expect(storefrontFixes).toContain(
      ".reference-catalog-grid .store-product-catalog",
    );
    expect(storefrontFixes).not.toContain(
      ".store-product-card{border-radius:.55rem}.store-product-catalog{",
    );
  });

  it("renders order rows as labelled mobile cards", () => {
    expect(orders).toContain('data-label="Order ID"');
    expect(orders).toContain('data-label="Payment status"');
    expect(css).toContain("content:attr(data-label)");
    expect(css).toContain(".orders-table-wrap thead{display:none}");
  });

  it("allows long protected-material filenames to wrap", () => {
    expect(reader).toContain('className="lesson-content reference-reader-content"');
    expect(css).toContain(".reader-heading h1{overflow-wrap:anywhere;word-break:break-word}");
    expect(css).toContain(".reference-reader-content,.material-reader{width:100%;overflow:hidden}");
  });
});
