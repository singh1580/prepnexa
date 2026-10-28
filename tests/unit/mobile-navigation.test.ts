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
  const css = readFileSync("src/app/tailwind.css", "utf8");
  const tailwindCss = css;
  const compactCss = css.replace(/\s+/g, "");
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
  const authShell = readFileSync("src/features/auth/ui/auth-shell.tsx", "utf8");

  it("keeps the hamburger before the official header logo without duplicating branding", () => {
    expect(publicHeader.indexOf('className="mobile-public-menu"')).toBeLessThan(
      publicHeader.indexOf("<Brand />"),
    );
    expect(drawer).not.toContain("<Brand />");
    expect(publicHeader).not.toContain(">Menu<");
    expect(drawer).toContain("[perspective:140px]");
    expect(drawer).toContain("bg-prep-orange");
    expect(drawer).toContain("prepstore-menu-top-depth");
    expect(drawer).toContain("group-open:[transform:translateZ(5px)]");
    expect(drawer).toContain("group-open:[transform:translateZ(11px)]");
    expect(drawer).not.toContain("group-open:rotate-45");
    expect(drawer).not.toContain("group-open:-rotate-45");
    expect(drawer).toContain("bg-[#17191c]");
    expect(css).toContain("@keyframes prepstore-menu-top-depth");
    expect(publicHeader).toContain("max-[1099px]:gap-3");
  });

  it("keeps the mobile menu and logo adjacent without squeezing either header", () => {
    expect(publicHeader).toContain("max-[1099px]:flex");
    expect(publicHeader).toContain("max-[1099px]:gap-3");
    expect(publicHeader).toContain("[&>.brand]:max-[1099px]:order-2");
    expect(publicHeader).toContain('className="mobile-public-menu order-1"');
    expect(drawer).toContain("hidden h-11 w-[25px] shrink-0");
  });

  it("keeps workspace search out of the compact mobile header", () => {
    const publicSearch = readFileSync(
      "src/components/public-search.tsx",
      "utf8",
    );
    expect(publicSearch).toContain(
      'max-w-none max-[1099px]:hidden',
    );
    expect(publicSearch).toContain(
      'max-w-[28rem] max-[1099px]:hidden',
    );
    expect(publicSearch).toContain(
      'className="public-live-search w-full max-w-[31rem]"',
    );
  });

  it("keeps public navigation ordered and account actions separate", () => {
    const home = publicHeader.indexOf('href="/">Home<');
    const packages = publicHeader.indexOf(">All packages<");
    const cart = publicHeader.indexOf('href="/cart"', home);
    const actions = publicHeader.indexOf('className="mt-2.5 grid');
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
    expect(workspaceShell).toContain("flex flex-col items-center");
    expect(workspaceShell).toContain("{email}");
    expect(workspaceShell).not.toContain("StudentBottomNavigation");
    expect(workspaceShell).not.toContain('label: "Cart"');
    expect(workspaceShell).not.toContain('label: "Profile & security"');
    expect(workspaceShell).toContain(
      "mb-2 flex min-h-12 items-center border-b",
    );
  });

  it("keeps package navigation separate from accessible collapse controls", () => {
    expect(workspaceShell).toContain("<SidebarDisclosure");
    expect(workspaceShell).not.toContain(
      '<details\n      className="package-sidebar-menu"',
    );
    expect(packageDisclosure).toContain("aria-expanded={open}");
    expect(packageDisclosure).toContain(
      'aria-label={`${open ? "Collapse" : "Expand"} ${label}`}',
    );
    expect(packageDisclosure).toContain("setOpen((value) => !value)");
  });

  it("resets document scroll for route and package-view navigation", () => {
    expect(workspaceShell).toContain("<WorkspaceRouteEffects />");
    expect(routeEffects).toContain("const pathname = usePathname()");
    expect(routeEffects).toContain('searchParams.get("view")');
    expect(routeEffects).toContain("window.scrollTo(0, 0)");
    expect(routeEffects).not.toContain(".admin-table-wrap, .table-scroll");
    expect(routeEffects).not.toContain(".orders-table-wrap");
    expect(routeEffects).not.toContain(".review-table-wrap");
    expect(routeEffects).toContain("[pathname, packageView]");
  });

  it("supports modal drawer accessibility and the approved responsive sizes", () => {
    expect(drawer).toContain('event.key === "Escape"');
    expect(drawer).toContain('event.key !== "Tab"');
    expect(drawer).toContain('document.body.style.overflow = "hidden"');
    expect(drawer).toContain('aria-label="Close navigation"');
    expect(drawer).toContain('aria-modal="true"');
    expect(drawer).toContain("w-[min(380px,calc(100vw-32px))]");
    expect(drawer).toContain("top-[calc(var(--mobile-header-height)+8px)]");
    expect(drawer).toContain(
      "max-h-[calc(100dvh-var(--mobile-header-height)-24px)]",
    );
    expect(drawer).toContain("rounded-[14px]");
    expect(drawer).toContain("fixed inset-0 z-[208]");
    expect(drawer).toContain("fixed inset-0 z-[99]");
    expect(drawer.match(/onClick=\{\(\) => close\(\)\}/g)).toHaveLength(1);
    expect(drawer).toContain("left-4 z-[100]");
    expect(drawer).toContain("left-0 z-[209]");
    expect(drawer).toContain("group-open:z-[210]");
    expect(tailwindCss).toContain("--mobile-header-height: 60px");
    expect(tailwindCss).toContain("--mobile-header-height: 58px");
  });

  it("separates the compact public menu from full-height workspace drawers", () => {
    expect(drawer).toContain('variant === "workspace"');
    expect(drawer).toContain(
      "[--workspace-drawer-width:min(360px,calc(100vw-32px))]",
    );
    expect(drawer.indexOf("[--workspace-drawer-width:min(360px")).toBeLessThan(
      drawer.indexOf("<summary"),
    );
    expect(drawer).toContain(
      "group-open:left-[calc(var(--workspace-drawer-width)-58px)]",
    );
    expect(drawer).toContain("min-h-dvh");
    expect(drawer).toContain("prepstore-workspace-drawer-enter");
    expect(drawer.indexOf("left-4 z-[100]")).toBeGreaterThan(
      drawer.indexOf('variant === "public"'),
    );
    expect(workspaceShell).toContain("z-[4] mt-auto border-t");
    expect(drawer).not.toContain(
      "group-open:top-[calc(var(--mobile-header-height)+18px)]",
    );
    expect(workspaceShell).toContain("border-b border-[#ebe7e2]");
  });

  it("provides a consistent back-to-home action across auth pages", () => {
    expect(authShell).toContain('href="/"');
    expect(authShell).toContain("Back to home");
    expect(authShell).toContain("min-h-11");
    expect(css).not.toContain(".auth-back-home");
  });

  it("keeps migrated navigation in Tailwind and the remaining legacy layer consolidated", () => {
    expect(compactCss).toContain("body{margin:0;min-width:320px;");
    expect(css).not.toContain(".store-product-card");
    expect(workspaceShell).toContain(
      "min-[1100px]:grid-cols-[minmax(240px,256px)_minmax(0,1fr)]",
    );
    expect(css).not.toContain(".workspace{");
    expect(css).not.toContain(".mobile-public-menu");
    expect(rootLayout).toContain('import "./tailwind.css"');
    expect(rootLayout).not.toContain('import "./styles.css"');
    expect(rootLayout).not.toContain("brand-system.css");
    expect(rootLayout).not.toContain("storefront-fixes.css");
    expect(publicHeader).not.toContain("brand-mark");
    expect(workspaceShell).not.toContain("student-mobile-menu");
    expect(workspaceShell).not.toContain("admin-mobile-menu");
  });
});
