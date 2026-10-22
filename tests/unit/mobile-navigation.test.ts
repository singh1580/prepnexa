import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive navigation", () => {
  const publicHeader = readFileSync("src/components/public-header.tsx", "utf8");
  const workspaceShell = readFileSync(
    "src/components/workspace-shell.tsx",
    "utf8",
  );
  const drawer = readFileSync("src/components/mobile-drawer.tsx", "utf8");
  const packageDisclosure = readFileSync(
    "src/components/sidebar-disclosure.tsx",
    "utf8",
  );
  const routeEffects = readFileSync(
    "src/components/workspace-route-effects.tsx",
    "utf8",
  );
  const css = readFileSync("src/app/styles.css", "utf8");
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
    expect(drawer).toContain('className="menu-icon-3d"');
    expect(drawer).toContain('className="menu-icon-bar menu-icon-bar-middle"');
    expect(drawer).not.toContain('d="m6 6 12 12M18 6 6 18"');
    expect(css).toContain("background: #17191c");
    expect(css).toContain("background: #e94b17");
    expect(css).toContain("gap: 4px !important");
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

  it("keeps package navigation separate from accessible collapse controls", () => {
    expect(workspaceShell).toContain("<SidebarDisclosure");
    expect(workspaceShell).not.toContain('<details\n      className="package-sidebar-menu"');
    expect(packageDisclosure).toContain('aria-expanded={open}');
    expect(packageDisclosure).toContain('aria-label={`${open ? "Collapse" : "Expand"} ${label}`}');
    expect(packageDisclosure).toContain("setOpen((value) => !value)");
  });

  it("resets document scroll for route and package-view navigation", () => {
    expect(workspaceShell).toContain("<WorkspaceRouteEffects />");
    expect(routeEffects).toContain("const pathname = usePathname()");
    expect(routeEffects).toContain('searchParams.get("view")');
    expect(routeEffects).toContain("window.scrollTo(0, 0)");
    expect(routeEffects).toContain(".admin-table-wrap, .table-scroll, .orders-table-wrap, .review-table-wrap");
    expect(routeEffects).toContain("scrollTo({ left: 0, top: 0 })");
    expect(routeEffects).toContain("[pathname, packageView]");
  });

  it("supports modal drawer accessibility and the approved responsive sizes", () => {
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain('event.key !== "Tab"');
    expect(drawer).toContain('document.body.style.overflow = "hidden"');
    expect(drawer).toContain('aria-label="Close navigation"');
    expect(drawer).toContain('aria-modal="true"');
    expect(css).toContain(
      "--mobile-drawer-width: min(380px, calc(100vw - 32px))",
    );
    expect(css).toContain("top: calc(var(--mobile-header-height) + 8px)");
    expect(css).toContain("max-height: calc(100dvh - var(--mobile-header-height) - 24px)");
    expect(css).toContain("border-radius: 14px");
    expect(css).toContain("justify-items: stretch !important");
    expect(css).toContain("position: fixed !important");
    expect(css).toContain("z-index: 208");
    expect(css).toContain("z-index: 209");
    expect(css).toContain("z-index: 210");
    expect(css).toContain("--mobile-header-height: 60px");
    expect(css).toContain("--mobile-header-height: 58px");
  });

  it("separates the compact public menu from full-height workspace drawers", () => {
    expect(css).toContain(
      ".workspace-mobile-menu[open] > .mobile-drawer-backdrop",
    );
    expect(css).toContain(
      "--workspace-drawer-width: min(360px, calc(100vw - 32px))",
    );
    expect(css).toContain("min-height: 100dvh");
    expect(css).toContain("transform: translateX(-100%)");
    expect(css).toContain(".workspace-drawer-logout {");
    expect(css).toContain("margin-top: auto");
    expect(css).toContain(
      ".mobile-public-menu[open] > summary {",
    );
    expect(css).toContain(
      "top: calc(var(--mobile-header-height) + 18px)",
    );
    expect(css).toContain(".workspace-drawer-brand {");
    expect(css).toContain("border-bottom: 1px solid #ebe7e2");
  });

  it("provides a consistent back-to-home action across auth pages", () => {
    expect(authShell).toContain('className="auth-back-home"');
    expect(authShell).toContain('href="/"');
    expect(authShell).toContain("Back to home");
  });

  it("keeps base and responsive navigation rules in one global stylesheet", () => {
    expect(css).toContain("body{margin:0;min-width:320px}");
    expect(css).toContain(".store-product-card");
    expect(css).toContain(".workspace{");
    expect(css).toContain(".mobile-public-menu");
    expect(rootLayout).toContain('import "./styles.css"');
    expect(rootLayout).not.toContain("brand-system.css");
    expect(rootLayout).not.toContain("storefront-fixes.css");
    expect(publicHeader).not.toContain("brand-mark");
    expect(workspaceShell).not.toContain("student-mobile-menu");
    expect(workspaceShell).not.toContain("admin-mobile-menu");
  });
});
