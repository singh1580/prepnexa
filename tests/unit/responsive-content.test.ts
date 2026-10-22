import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive content integrity", () => {
  const css = readFileSync("src/app/styles.css", "utf8");
  const heroCarousel = readFileSync(
    "src/components/hero-carousel.tsx",
    "utf8",
  );
  const workspaceShell = readFileSync("src/components/workspace-shell.tsx", "utf8");
  const studentDashboard = readFileSync(
    "src/app/(workspace)/dashboard/page.tsx",
    "utf8",
  );
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
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
  const materialAccessRoute = readFileSync(
    "src/app/api/materials/[id]/access/route.ts",
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
  const profilePage = readFileSync(
    "src/app/(workspace)/account/profile/page.tsx",
    "utf8",
  );
  const testForms = readFileSync(
    "src/features/admin-tests/ui/forms.tsx",
    "utf8",
  );
  const studentActions = readFileSync(
    "src/features/operations/ui/student-actions.tsx",
    "utf8",
  );
  const adminOrders = readFileSync(
    "src/app/(workspace)/admin/orders/page.tsx",
    "utf8",
  );
  const adminStudents = readFileSync(
    "src/app/(workspace)/admin/students/page.tsx",
    "utf8",
  );
  const adminCoupons = readFileSync(
    "src/app/(workspace)/admin/coupons/page.tsx",
    "utf8",
  );
  const adminNotifications = readFileSync(
    "src/app/(workspace)/admin/notifications/page.tsx",
    "utf8",
  );
  const adminModal = readFileSync("src/components/admin-modal.tsx", "utf8");
  const accountActions = readFileSync(
    "src/features/account/account-actions.tsx",
    "utf8",
  );
  const packagesPage = readFileSync(
    "src/app/(public)/packages/page.tsx",
    "utf8",
  );
  const catalogFilterDisclosure = readFileSync(
    "src/features/catalog/ui/catalog-filter-disclosure.tsx",
    "utf8",
  );
  const publicLayout = readFileSync(
    "src/app/(public)/layout.tsx",
    "utf8",
  );
  const authForm = readFileSync(
    "src/features/auth/ui/auth-form.tsx",
    "utf8",
  );
  const storefrontProductCard = readFileSync(
    "src/components/storefront-product-card.tsx",
    "utf8",
  );

  it("keeps account password changes in-session and package content destinations explicit",()=>{
    expect(profilePage).toContain("<ChangePasswordForm/>");
    expect(profilePage).not.toContain('href="/forgot-password">Change password');
    expect(coursePage).toContain('?view=materials`');
    expect(coursePage).toContain('?view=tests`');
    expect(coursePage).not.toContain('Package content</h2><p>Everything included');
  });

  it("keeps refund navigation canonical and password guidance neutral", () => {
    expect(publicLayout).not.toContain(">Refund policy<");
    expect(
      publicLayout.match(/href="\/legal\/cancellation-refund"/g),
    ).toHaveLength(1);
    expect(authForm).toContain('aria-label="Password guidance"');
    expect(css).toContain(
      ".auth-card .password-requirements li::before",
    );
    expect(css).toContain('content: "" !important');
  });

  it("keeps product tabs inside their mobile container", () => {
    expect(css).not.toContain(
      ".reference-product-tabs{margin-inline:-1.25rem;padding-inline:1.25rem}",
    );
    expect(css).toContain(".reference-product-tabs{position:static;display:flex;width:100%");
  });

  it("limits horizontal catalogue cards to the catalogue grid", () => {
    expect(css).toContain(
      ".reference-catalog-grid .store-product-catalog",
    );
    expect(css).not.toContain(
      ".store-product-card{border-radius:.55rem}.store-product-catalog{",
    );
  });

  it("keeps storefront cards compact and related packages swipeable on phones", () => {
    expect(storefrontProductCard).not.toContain("product.description||");
    expect(storefrontProductCard).toContain(
      'variant==="catalog"?<div className="store-content-counts">',
    );
    expect(css).toContain(
      ".store-home .store-card-actions {\n    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;",
    );
    expect(css).toContain(
      ".reference-related > div,\n  .cart-recommendations > div {",
    );
    expect(css).toContain("grid-auto-flow: column;");
    expect(css).toContain("scroll-snap-type: inline mandatory;");
    expect(css).toContain("aspect-ratio: 3 / 2;");
    expect(css).toContain(
      "grid-template-columns: auto auto minmax(0, 1fr);",
    );
  });

  it("sizes package details from content without duplicate divider bands", () => {
    expect(css).toContain(
      ".reference-product-panel {\n  min-height: 0;",
    );
    expect(css).toContain("border-bottom: 0;");
    expect(css).toContain(
      ".reference-related {\n  margin-top: .35rem;",
    );
  });

  it("anchors mobile hero search and uses the shared responsive carousel", () => {
    expect(css).toContain(
      ".public-site .store-hero-content {\n    position: absolute !important;\n    inset: 0;",
    );
    expect(css).toContain(
      "bottom: .7rem !important;",
    );
    expect(css).toContain("touch-action: pan-y;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(heroCarousel.match(/home-[a-z-]+\.webp/g)).toHaveLength(8);
    expect(heroCarousel.match(/student-[a-z-]+\.webp/g)).toHaveLength(8);
    expect(heroCarousel.match(/student-[a-z-]+-desktop\.webp/g)).toHaveLength(4);
    expect(heroCarousel.match(/home-[a-z-]+-responsive\.webp/g)).toHaveLength(4);
    expect(heroCarousel).toContain('<source media="(min-width: 900px)"');
    expect(heroCarousel).toContain('<source media="(max-width: 899px)"');
    expect(heroCarousel).toContain('sizes="(max-width: 899px) 100vw, calc(100vw - 240px)"');
    expect(css).toContain("@media (max-width: 899px)");
    expect(css).toContain("@media (min-width: 900px) and (max-width: 1279px)");
    expect(css).not.toContain("@media(max-width:950px){.course-outline{position:static}.auth-shell");
    expect(css).toContain("@media(max-width:899px){.featured-store-grid{grid-template-columns:repeat(2,1fr)}");
    expect(css).not.toContain(".hero-search{max-width:32rem}.featured-store-grid{grid-template-columns:1fr}");
    expect(heroCarousel).toContain('fetchPriority={index === 0 ? "high" : "auto"}');
    expect(heroCarousel).toContain("document.visibilityState");
    expect(heroCarousel).not.toContain("controls=");
    expect(heroCarousel).toContain("onPointerUp={handlePointerUp}");
    expect(heroCarousel).toContain("if (distance > 0) showPrevious(); else showNext();");
    expect(heroCarousel).not.toContain("ArrowIcon");
    expect(heroCarousel).not.toContain("PauseIcon");
    expect(heroCarousel).toContain("hero-carousel-label");
    expect(heroCarousel.indexOf("hero-carousel-dots")).toBeLessThan(
      heroCarousel.indexOf("hero-carousel-label"),
    );
    expect(heroCarousel).toContain("unoptimized");
    expect(css).toContain(".home-hero-carousel .hero-carousel-slide img {\n  object-fit: cover;");
    expect(css).toContain(".student-hero-carousel .hero-carousel-slide img {\n  object-fit: cover;");
    expect(css).toContain(".hero-carousel-picture {\n  position: absolute;");
    expect(css).toContain("left: clamp(1rem, 7vw, 7.2rem)");
    expect(css).toContain(".public-site .hero-search {\n    position: absolute;");
    expect(css).toContain("bottom: 2rem;");
    expect(css).toContain("left: clamp(2rem, 7vw, 7.2rem);");
    expect(css).toContain(".home-hero-carousel .hero-carousel-controls {\n    bottom: 6.25rem;");
    expect(css).toContain("bottom: 3.75rem");
    expect(css).not.toContain(".hero-carousel-controls.has-full-controls");
    expect(css).not.toContain(".hero-carousel-arrow");
    expect(css).not.toContain(".hero-carousel-toggle");
    const homeControls = css.match(
      /\.hero-carousel-controls\.has-dot-controls \{([^}]*)\}/,
    )?.[1];
    expect(homeControls).toBeDefined();
    expect(homeControls).not.toMatch(/right:|padding:|border:|background:|box-shadow:|backdrop-filter:/);
    expect(css).not.toContain(".student-reference-banner:after");
    expect(css).not.toContain(".student-reference-banner:after");
    expect(css).not.toContain(".student-reference-banner::after");
    expect(css).not.toContain(".store-hero:after");
    expect(css).not.toContain(".store-hero::after");
    expect(css).toContain(
      ".student-dashboard-main > .student-reference-banner {\n    min-height: 18.5rem;",
    );
    expect(css).toContain(
      ".student-reference-banner {\n    min-height: 18rem;",
    );
    expect(css).not.toContain(
      "@media (max-width: 800px) {\n  .student-dashboard-main > .student-reference-banner",
    );
    expect(studentDashboard).toContain('mainClassName="student-dashboard-main"');
    expect(studentDashboard).toContain('className="student-dashboard-content"');
    expect(workspaceShell).toContain("mainClassName?: string");
    expect(css).toContain(".student-workspace .workspace-main.student-dashboard-main {\n  max-width: none;\n  padding: 0 !important;");
    expect(heroCarousel).not.toContain("hero-handwriting");
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
    expect(securePdfViewer).toContain("toolbar=0&navpanes=0&scrollbar=1&view=Fit");
    expect(securePdfViewer).not.toContain("toolbar=1");
    expect(reader).toContain("Personalised watermark · access logged");
    expect(materialAccessRoute).toContain("Location: location");
    expect(materialAccessRoute).not.toContain("Response.redirect");
    expect(materialAccessRoute).not.toContain("new URL(`/api/materials/");
  });

  it("renders invoice items as labelled mobile rows", () => {
    expect(invoicePage).toContain('data-label="Description"');
    expect(invoicePage).toContain('data-label="Access period"');
    expect(invoicePage).toContain('data-label="Amount"');
    expect(css).toContain(".invoice-page .invoice thead{display:none}");
    expect(invoicePage).not.toContain("<PublicHeader");
    expect(invoicePage).toContain("<PrepstoreLogo");
    expect(css).toContain(".invoice-page-header");
    expect(css).toContain("@media print");
    expect(css).toContain(".invoice-page-header,");
  });

  it("loads one consolidated global stylesheet", () => {
    expect(rootLayout).toContain('import "./styles.css"');
    expect(rootLayout).not.toContain("storefront-fixes.css");
    expect(rootLayout).not.toContain("brand-system.css");
    expect(rootLayout).not.toContain("final-review-polish.css");
    expect(css).toContain(".admin-workspace .admin-list-controls");
    expect(css).toContain(".admin-side-detail.reference-order-detail");
    expect(css).toContain(".product-create-form .dialog-form-footer");
  });

  it("keeps desktop workspace dividers continuous without stretching student navigation", () => {
    expect(css).toContain(
      ".student-workspace.workspace {",
    );
    expect(css).toContain(
      "grid-template-columns: minmax(240px, 256px) minmax(0, 1fr) !important",
    );
    expect(css).toContain(".admin-workspace > .sidebar::before");
    expect(css).toContain(".student-workspace > .sidebar::before");
    expect(css).toContain("top: 63px");
    expect(css).toContain("grid-auto-rows: max-content");
    expect(css).toContain("align-content: start");
    expect(css).toContain(
      ".student-workspace .workspace-header {",
    );
    expect(css).toContain(
      "border-bottom: 1px solid var(--review-line) !important",
    );
    expect(css).toContain(
      "border-right: 1px solid var(--review-line) !important",
    );
    expect(css).toContain(
      "border-left: 1px solid var(--review-line) !important",
    );
  });

  it("asks for confirmation before ending a signed-in session", () => {
    expect(accountActions).toContain('<dialog ref={dialogRef} className="logout-confirm-backdrop"');
    expect(accountActions).toContain("dialog.showModal()");
    expect(accountActions).toContain("aria-labelledby={titleId}");
    expect(accountActions).toContain("Sign out of Prepstore?");
    expect(accountActions).toContain("setConfirming(true)");
    expect(css).toContain(".logout-confirm-dialog");
  });

  it("keeps the test title, timer and section selector compact", () => {
    expect(css).toContain(
      ".student-workspace .attempt-runner",
    );
    expect(css).toContain(
      ".student-workspace .attempt-section-tabs",
    );
    expect(css).toContain("margin: 0 !important");
    expect(css).toContain("min-width: 8.5rem !important");
    expect(css).toContain(
      ".student-workspace .attempt-timer strong",
    );
  });

  it("uses swipeable two-card home shelves on phones", () => {
    expect(css).toContain(
      ".store-home .featured-store-grid",
    );
    expect(css).toContain("grid-auto-flow: column");
    expect(css).toContain(
      "grid-auto-columns: minmax(0, calc((100% - .65rem) / 2))",
    );
    expect(css).toContain("scroll-snap-type: inline mandatory");
    expect(css).toContain(
      ".store-home .store-product-compact .store-product-title",
    );
  });

  it("uses a compact mobile catalogue disclosure and bounded product covers", () => {
    expect(packagesPage).toContain("<CatalogFilterDisclosure");
    expect(packagesPage).toContain("activeFilterCount");
    expect(packagesPage).not.toContain("<details");
    expect(packagesPage).not.toContain("<span>⌃</span>");
    expect(catalogFilterDisclosure).toContain('aria-expanded={open}');
    expect(catalogFilterDisclosure).toContain('type="button"');
    expect(css).toContain(
      ".catalog-filter-trigger",
    );
    expect(css).toContain(
      "grid-template-columns: repeat(2, minmax(0, 1fr))",
    );
    expect(css).toContain("height: 10.75rem !important");
    expect(css).toContain("grid-column: 1 / -1");
    expect(css).toContain("white-space: nowrap");
  });

  it("keeps mobile hero copy clear of the subject and strengthens owned actions", () => {
    expect(css).toContain("object-position: right center");
    expect(css).toContain("max-width: 52%");
    expect(css).toContain(
      ".public-site .hero-search:focus-within",
    );
    expect(css).toContain(
      ".public-site .hero-search input:focus-visible",
    );
    expect(css).toContain("aspect-ratio: 3 / 2");
    expect(css).toContain(".cover-tone-1{background-color:#e7edf8");
    expect(css).toContain(".store-home .store-owned-action");
    expect(css).toContain("background: #c73c0b");
  });

  it("removes reserved card-title space and keeps both support conversations compact", () => {
    expect(css).toContain("min-height: 0;");
    expect(css).toContain(".reference-ticket .support-message {");
    expect(css).toContain("border-radius: 0;");
    expect(css).toContain(
      ".admin-ticket-panel .admin-conversation .support-message",
    );
    expect(css).toContain("max-height: none;");
    expect(css).toContain("overflow: visible;");
    expect(css).toContain(
      "grid-template-columns: 2.35rem minmax(0, 1fr)",
    );
    expect(css).not.toContain(".support-split-detail");
  });

  it("keeps admin header account actions in a compact right-side group", () => {
    expect(css).toContain(".admin-workspace .workspace-header {");
    expect(css).toContain("justify-content: flex-start !important");
    expect(css).toContain(
      ".admin-workspace .workspace-header > .public-live-search",
    );
    expect(css).toContain("margin: 0 auto 0 0 !important");
    expect(css).toContain(
      ".admin-workspace .workspace-header > .student-header-account",
    );
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

  it("uses semantic status colours instead of falling back to grey", () => {
    expect(css).toContain(".status-active,.status-paid,.status-enabled");
    expect(css).toContain(".status-pending,.status-created,.status-required");
    expect(css).toContain(".status-failed,.status-suspended,.status-blocked");
    expect(css).toContain(".status-cancelled,.status-expired,.status-closed");
    expect(css).toContain(".status-refunded,.status-partially_refunded");
    expect(profilePage).toContain("status-enabled");
    expect(profilePage).toContain("status-required");
  });

  it("keeps workspace forms and dialogs bounded at desktop and mobile sizes", () => {
    expect(css).toContain(".change-password-form fieldset{margin:0;padding:0;border:0}");
    expect(css).toContain(".admin-workspace .admin-dialog.dialog-large {");
    expect(css).toContain("width: min(60rem, calc(100vw - 2rem)) !important");
    expect(css).toContain("max-height: calc(100dvh - 2rem) !important");
    expect(css).toContain(".dialog-body{min-height:0;max-height:none;overflow-y:auto}");
    expect(css).toContain(".support-ticket-create-form fieldset{display:grid;grid-template-columns:1fr 1fr");
    expect(studentActions).toContain('className="admin-form support-ticket-create-form"');
    expect(css).toContain('.cover-upload-field input[type="file"]::file-selector-button');
  });

  it("keeps test editing compact and uses the primary save action", () => {
    expect(css).toContain('.test-create-workspace input:not([type="checkbox"])');
    expect(css).toContain(".test-settings-card .check-row{min-height:2.25rem");
    expect(testForms).toContain('{busy === "settings" ? "Saving…" : "Save settings"}');
    expect(testForms).not.toContain('<button className="button secondary" type="submit">\n                {busy === "settings"');
  });

  it("keeps the identifier column visible while wide admin tables scroll", () => {
    expect(css).toContain(".reference-order-card .admin-table th:first-child");
    expect(css).toContain(".reference-student-card .admin-table th:first-child");
    expect(css).toContain("position:sticky;left:0");
  });

  it("turns dense admin lists into labelled cards on phones", () => {
    expect(adminOrders).toContain('data-label="Order ID"');
    expect(adminStudents).toContain('data-label="Account status"');
    expect(adminCoupons).toContain('data-label="Discount"');
    expect(adminNotifications).toContain('data-label="Recipients"');
    expect(css).toContain(
      ".reference-order-card .admin-table td::before",
    );
    expect(css).toContain("content: attr(data-label)");
  });

  it("protects changed modal forms from accidental dismissal", () => {
    expect(adminModal).toContain("Discard your unsaved changes?");
    expect(adminModal).toContain("onCancel=");
    expect(adminModal).toContain("onInputCapture=");
  });
});
