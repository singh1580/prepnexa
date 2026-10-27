import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("Prepstore shared brand asset", () => {
  const logo = readFileSync("public/brand/prepstore-logo.svg", "utf8");
  const component = readFileSync("src/components/brand.tsx", "utf8");
  const layout = readFileSync("src/app/layout.tsx", "utf8");

  it("keeps the supplied final vector asset unchanged", () => {
    expect(createHash("sha256").update(logo).digest("hex")).toBe(
      "0fb78f162e488edf2a2f2399b0b19f85f6797257eb533f04c2cdee6f644bd522",
    );
    expect(logo).toContain('width="728" height="160" viewBox="0 0 728 160"');
    expect(logo).toContain("#E84714");
    expect(logo).toContain("#151719");
    expect(logo).toContain("#17191C");
    expect(logo).toContain("#E94B17");
    expect(logo).not.toMatch(/#(?:777a80|777b80|b8babd|686b70)/i);
  });

  it("ships the supplied fallback, favicon, and app-icon set", () => {
    [
      "public/brand/prepstore-logo@4x.png",
      "public/favicon.ico",
      "public/favicon-96.png",
      "public/prepstore-icon.svg",
      "public/prepstore-icon-32.png",
      "public/prepstore-icon-48.png",
      "public/prepstore-icon-180.png",
      "public/prepstore-icon-192.png",
      "public/prepstore-icon-512.png",
    ].forEach((path) => expect(existsSync(path), path).toBe(true));
  });

  it("advertises a padded high-resolution favicon for search surfaces", () => {
    expect(layout).toContain('{ url: "/favicon.ico", sizes: "any" }');
    expect(layout).toContain(
      '{ url: "/favicon-96.png", sizes: "96x96", type: "image/png" }',
    );
    expect(layout).not.toContain(
      '{ url: "/prepstore-icon.svg", type: "image/svg+xml" }',
    );
  });

  it("is rendered through the shared image-backed component", () => {
    expect(component).toContain('src="/brand/prepstore-logo.svg"');
    expect(component).toContain('src="/prepstore-icon.svg"');
    expect(component).toContain("width={728}");
    expect(component).toContain("height={160}");
    expect(component).not.toContain('className="brand-mark"');
    expect(component).not.toContain('className="brand-word"');
    expect(component).toContain('footer: {');
    expect(component).toContain('w-[164px] min-w-[164px]');
  });

  it("does not recreate the supplied brand mark in commerce and support surfaces", () => {
    const sources = [
      "src/features/commerce/ui/cart-workflow.tsx",
      "src/features/commerce/ui/razorpay-payment.tsx",
      "src/app/(workspace)/invoice/[id]/page.tsx",
      "src/app/(workspace)/dashboard/orders/[id]/page.tsx",
      "src/app/(workspace)/dashboard/support/[id]/page.tsx",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const compactSources = sources.replace(/\s+/g, "");

    expect(sources).not.toContain("prepstore-checkout-mark.svg");
    expect(sources).not.toMatch(/>PS<|Prep<span>store<\/span>/);
    expect(compactSources).toMatch(
      /newURL\("\/brand\/prepstore-logo\.svg",window\.location\.origin,?\)/,
    );
    expect(sources).toContain("PrepstoreIcon");
    expect(sources).toContain("PrepstoreLogo");
  });

  it("keeps the two-colour support icon visible on a neutral avatar", () => {
    const polish = readFileSync("src/app/tailwind.css", "utf8");
    const compactPolish = polish.replace(/\s+/g, "");
    const studentSupport = readFileSync(
      "src/app/(workspace)/dashboard/support/[id]/page.tsx",
      "utf8",
    );

    expect(studentSupport).toContain("border border-[#eadfd8] bg-white");
    expect(studentSupport).toContain("[&_img]:object-contain");
    expect(compactPolish).not.toContain(
      ".support-message.support.thread-avatar",
    );
  });
});
