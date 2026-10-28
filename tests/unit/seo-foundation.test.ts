import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("SEO foundation", () => {
  const rootLayout = read("src/app/layout.tsx");
  const robots = read("src/app/robots.ts");
  const sitemap = read("src/app/sitemap.ts");
  const authLayout = read("src/app/(auth)/layout.tsx");
  const workspaceLayout = read("src/app/(workspace)/layout.tsx");
  const catalogue = read("src/app/(public)/packages/page.tsx");
  const packageDetail = read("src/app/(public)/packages/[slug]/page.tsx");
  const publishingService = read("src/features/admin-catalog/service.ts");
  const migration = read("drizzle/0033_messy_morlun.sql");

  it("publishes canonical crawl controls and a database-backed sitemap", () => {
    expect(rootLayout).toContain("metadataBase: SITE_URL");
    expect(rootLayout).not.toContain('url: "/",');
    expect(robots).toContain('sitemap: `${SITE_ORIGIN}/sitemap.xml`');
    expect(robots).toContain('"/admin/"');
    expect(sitemap).toContain("listSitemapProducts()");
    expect(sitemap).toContain('dynamic = "force-dynamic"');
    expect(sitemap).toContain('"/about"');
    expect(sitemap).toContain("product.updatedAt");
    expect(sitemap).not.toContain("generatedAt");
  });

  it("keeps private routes out of search and filter variants canonical", () => {
    for (const layout of [authLayout, workspaceLayout]) {
      expect(layout).toContain("index: false");
      expect(layout).toContain("follow: false");
    }
    expect(catalogue).toContain('alternates: { canonical: "/packages" }');
    expect(catalogue).toContain("filtered ? { index: false, follow: true }");
  });

  it("uses truthful product structured data and only adds real ratings", () => {
    expect(packageDetail).toContain('"@type": "Product"');
    expect(packageDetail).toContain('"@type": "Offer"');
    expect(packageDetail).toContain('"@type": "BreadcrumbList"');
    expect(packageDetail).toContain("if (product.reviewCount > 0)");
    expect(packageDetail).toContain("productSchema.aggregateRating");
  });

  it("blocks incomplete packages from publishing without breaking drafts", () => {
    for (const field of [
      "cover image",
      "exam name",
      "category",
      "target audience",
      "SEO title",
      "SEO description",
      "public description",
      "syllabus",
    ]) {
      expect(publishingService).toContain(field);
    }
    expect(migration.match(/ADD COLUMN/g)).toHaveLength(5);
    expect(migration).not.toMatch(/DROP|DELETE|NOT NULL/i);
  });
});
