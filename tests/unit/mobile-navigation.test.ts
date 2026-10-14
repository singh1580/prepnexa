import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive navigation", () => {
  const publicHeader = readFileSync("src/components/public-header.tsx", "utf8");
  const workspaceShell = readFileSync(
    "src/components/workspace-shell.tsx",
    "utf8",
  );
  const drawer = readFileSync("src/components/mobile-drawer.tsx", "utf8");
  const responsiveCss = readFileSync("src/app/brand-system.css", "utf8");
  const legacyCss = [
    readFileSync("src/app/styles.css", "utf8"),
    readFileSync("src/app/storefront-fixes.css", "utf8"),
  ].join("\n");

  it("keeps the hamburger before the official logo without a duplicate drawer logo", () => {
    expect(publicHeader.indexOf('className="mobile-public-menu"')).toBeLessThan(
      publicHeader.indexOf("<Brand />"),
    );
    expect(publicHeader).not.toContain("mobile-drawer-brand");
    expect(publicHeader).not.toContain(">Home<");
    expect(publicHeader).not.toContain(">Menu<");
  });

  it("keeps public navigation ordered and account actions separate", () => {
    const packages = publicHeader.indexOf(">All packages<");
    const cart = publicHeader.indexOf(">Cart<");
    const support = publicHeader.indexOf("Help &amp; support");
    const actions = publicHeader.indexOf('className="mobile-drawer-actions"');
    expect(packages).toBeGreaterThan(-1);
    expect(packages).toBeLessThan(cart);
    expect(cart).toBeLessThan(support);
    expect(support).toBeLessThan(actions);
    expect(publicHeader).toContain("<CartCount />");
  });

  it("uses the centred account profile and avoids repeated student cart navigation", () => {
    expect(workspaceShell).toContain('className="mobile-drawer-profile"');
    expect(workspaceShell).toContain("<small>{email}</small>");
    expect(workspaceShell).not.toContain("StudentBottomNavigation");
    expect(workspaceShell).not.toContain('label: "Cart"');
    expect(workspaceShell).not.toContain('label: "Profile & security"');
    expect(workspaceShell).not.toContain("workspace-drawer-brand");
  });

  it("supports modal drawer accessibility and the approved responsive sizes", () => {
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain('event.key !== "Tab"');
    expect(drawer).toContain('document.body.style.overflow = "hidden"');
    expect(drawer).toContain('aria-label="Close navigation"');
    expect(drawer).toContain('aria-modal="true"');
    expect(responsiveCss).toContain("width: min(320px, 88vw)");
    expect(responsiveCss).toContain("width: 92vw");
    expect(responsiveCss).toContain("--mobile-header-height: 60px");
    expect(responsiveCss).toContain("--mobile-header-height: 58px");
  });

  it("removes obsolete text-logo and competing mobile-navigation CSS", () => {
    expect(legacyCss).not.toMatch(/\.brand-(?:mark|word)/);
    expect(legacyCss).not.toMatch(
      /\.(?:student-bottom-nav|student-mobile-menu|admin-mobile-menu|mobile-public-actions)/,
    );
  });
});
