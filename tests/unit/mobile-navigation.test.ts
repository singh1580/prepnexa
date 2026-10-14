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
  const baseCss = readFileSync("src/app/styles.css", "utf8");
  const storefrontFixes = readFileSync(
    "src/app/storefront-fixes.css",
    "utf8",
  );
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
  const authShell = readFileSync(
    "src/features/auth/ui/auth-shell.tsx",
    "utf8",
  );

  it("keeps the hamburger before the official header logo without duplicating branding", () => {
    expect(publicHeader.indexOf('className="mobile-public-menu"')).toBeLessThan(
      publicHeader.indexOf("<Brand />"),
    );
    expect(drawer).not.toContain("<Brand />");
    expect(publicHeader).not.toContain(">Menu<");
  });

  it("keeps public navigation ordered and account actions separate", () => {
    const home = publicHeader.indexOf('href="/">Home<');
    const packages = publicHeader.indexOf(">All packages<");
    const cart = publicHeader.indexOf("mobile-drawer-cart");
    const actions = publicHeader.indexOf('className="mobile-drawer-actions"');
    expect(home).toBeGreaterThan(-1);
    expect(packages).toBeGreaterThan(-1);
    expect(home).toBeLessThan(cart);
    expect(cart).toBeLessThan(packages);
    expect(packages).toBeLessThan(actions);
    expect(publicHeader).not.toContain("Help &amp; support");
    expect(publicHeader).toContain("<CartCount />");
    expect(publicHeader).toContain("Create account");
    expect(publicHeader).toContain('href="/signup"');
  });

  it("uses the centred account profile and avoids repeated student cart navigation", () => {
    expect(workspaceShell).toContain('className="mobile-drawer-profile"');
    expect(workspaceShell).toContain("<small>{email}</small>");
    expect(workspaceShell).not.toContain("StudentBottomNavigation");
    expect(workspaceShell).not.toContain('label: "Cart"');
    expect(workspaceShell).not.toContain('label: "Profile & security"');
    expect(workspaceShell).toContain('className="workspace-drawer-brand"');
  });

  it("supports modal drawer accessibility and the approved responsive sizes", () => {
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain('event.key !== "Tab"');
    expect(drawer).toContain('document.body.style.overflow = "hidden"');
    expect(drawer).toContain('aria-label="Close navigation"');
    expect(drawer).toContain('aria-modal="true"');
    expect(responsiveCss).toContain(
      "--mobile-drawer-width: min(380px, calc(100vw - 32px))",
    );
    expect(responsiveCss).toContain("top: calc(var(--mobile-header-height) + 8px)");
    expect(responsiveCss).toContain("max-height: calc(100dvh - var(--mobile-header-height) - 24px)");
    expect(responsiveCss).toContain("border-radius: 14px");
    expect(responsiveCss).toContain("justify-items: stretch !important");
    expect(responsiveCss).toContain("position: fixed !important");
    expect(responsiveCss).toContain("--mobile-header-height: 60px");
    expect(responsiveCss).toContain("--mobile-header-height: 58px");
  });

  it("separates the compact public menu from full-height workspace drawers", () => {
    expect(responsiveCss).toContain(
      ".workspace-mobile-menu[open] > .mobile-drawer-backdrop",
    );
    expect(responsiveCss).toContain(
      "--workspace-drawer-width: min(360px, calc(100vw - 32px))",
    );
    expect(responsiveCss).toContain("min-height: 100dvh");
    expect(responsiveCss).toContain("transform: translateX(-100%)");
    expect(responsiveCss).toContain(".workspace-drawer-logout {");
    expect(responsiveCss).toContain("margin-top: auto");
    expect(responsiveCss).toContain(
      ".mobile-public-menu[open] > summary {",
    );
    expect(responsiveCss).toContain(
      "top: calc(var(--mobile-header-height) + 18px)",
    );
    expect(responsiveCss).toContain(".workspace-drawer-brand {");
    expect(responsiveCss).toContain("border-bottom: 1px solid #ebe7e2");
  });

  it("provides a consistent back-to-home action across auth pages", () => {
    expect(authShell).toContain('className="auth-back-home"');
    expect(authShell).toContain('href="/"');
    expect(authShell).toContain("Back to home");
  });

  it("keeps the complete base stylesheet and applies responsive overrides last", () => {
    expect(baseCss).toContain("body{margin:0;min-width:320px}");
    expect(baseCss).toContain(".store-product-card");
    expect(baseCss).toContain(".workspace{");
    expect(baseCss).not.toContain(".mobile-public-menu");
    expect(baseCss).not.toContain(".student-mobile-menu");
    expect(baseCss).not.toContain(".admin-mobile-menu");
    expect(storefrontFixes).not.toContain(".mobile-public-menu");
    expect(storefrontFixes).not.toContain(".student-mobile-menu");
    expect(storefrontFixes).not.toContain(".admin-mobile-menu");
    expect(rootLayout.indexOf('import "./styles.css"')).toBeLessThan(
      rootLayout.indexOf('import "./brand-system.css"'),
    );
    expect(publicHeader).not.toContain("brand-mark");
    expect(workspaceShell).not.toContain("student-mobile-menu");
    expect(workspaceShell).not.toContain("admin-mobile-menu");
  });
});
