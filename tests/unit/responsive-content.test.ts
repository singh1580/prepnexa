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
  const materialContentRoute = readFileSync(
    "src/app/api/materials/[id]/content/route.ts",
    "utf8",
  );
  const coursePage = readFileSync(
    "src/app/(workspace)/dashboard/courses/[slug]/page.tsx",
    "utf8",
  );
  const invoicePage = readFileSync(
    "src/app/(workspace)/invoice/[id]/page.tsx",
    "utf8",
  );
  const securePdfViewer = readFileSync(
    "src/features/materials/ui/secure-pdf-viewer.tsx",
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

  it("allows protected PDFs to render only inside the same-origin reader", () => {
    expect(materialContentRoute).toContain('"X-Frame-Options": "SAMEORIGIN"');
    expect(materialContentRoute).toContain("frame-ancestors 'self'");
    expect(materialContentRoute).not.toContain("default-src 'none'; sandbox");
    expect(reader).toContain("<SecurePdfViewer");
    expect(securePdfViewer).toContain("URL.createObjectURL(blob)");
    expect(securePdfViewer).toContain('credentials: "same-origin"');
  });

  it("renders invoice items as labelled mobile rows", () => {
    expect(invoicePage).toContain('data-label="Description"');
    expect(invoicePage).toContain('data-label="Access period"');
    expect(invoicePage).toContain('data-label="Amount"');
    expect(css).toContain(".invoice-page .invoice thead{display:none}");
  });

  it("uses a compact course heading and includes the active view in breadcrumbs", () => {
    expect(coursePage).not.toContain('"MY PACKAGE"');
    expect(coursePage).toContain("<b>{viewLabel}</b>");
    expect(coursePage).toContain('view==="overview"?"Overview"');
  });

  it("turns question review rows into mobile cards instead of a wide table", () => {
    expect(css).not.toContain(".review-table-wrap table{min-width:700px}");
    expect(css).toContain(".review-row-summary>span:before{content:attr(data-label)");
    expect(css).toContain(".section-performance-head{display:none}");
    expect(css).toContain(".reference-performance>div{grid-template-columns:repeat(6,minmax(0,1fr))}");
  });
});
