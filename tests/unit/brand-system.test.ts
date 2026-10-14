import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("Prepstore shared brand asset", () => {
  const logo = readFileSync("public/brand/prepstore-logo.svg", "utf8");
  const component = readFileSync("src/components/brand.tsx", "utf8");

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
      "public/prepstore-icon.svg",
      "public/prepstore-icon-32.png",
      "public/prepstore-icon-48.png",
      "public/prepstore-icon-180.png",
      "public/prepstore-icon-192.png",
      "public/prepstore-icon-512.png",
    ].forEach((path) => expect(existsSync(path), path).toBe(true));
  });

  it("is rendered through the shared image-backed component", () => {
    expect(component).toContain('src="/brand/prepstore-logo.svg"');
    expect(component).toContain("width={728}");
    expect(component).toContain("height={160}");
    expect(component).not.toContain('className="brand-mark"');
    expect(component).not.toContain('className="brand-word"');
  });
});
