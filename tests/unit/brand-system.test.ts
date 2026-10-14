import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prepstore shared brand asset", () => {
  const logo = readFileSync("public/brand/prepstore-logo.svg", "utf8");
  const component = readFileSync("src/components/brand.tsx", "utf8");

  it("keeps the approved master dimensions and colours", () => {
    expect(logo).toContain('width="199" height="36"');
    expect(logo).toContain("#e84714");
    expect(logo).toContain("#151719");
    expect(logo).toContain('x="3" y="3" width="16" height="16" rx="3.5" fill="#17191c"');
    expect(logo).toContain('x="15" y="15" width="16" height="16" rx="3.5" fill="#e94b17"');
    expect(logo).not.toMatch(/#(?:777a80|777b80|b8babd|686b70)/i);
  });

  it("is rendered through the shared image-backed component", () => {
    expect(component).toContain('src="/brand/prepstore-logo.svg"');
    expect(component).not.toContain('className="brand-mark"');
    expect(component).not.toContain('className="brand-word"');
  });
});
