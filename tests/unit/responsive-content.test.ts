import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive content integrity", () => {
  const css = readFileSync("src/app/tailwind.css", "utf8");
  const heroCarousel = readFileSync("src/components/hero-carousel.tsx", "utf8");
  const workspaceShell = readFileSync(
    "src/components/workspace-shell.tsx",
    "utf8",
  );
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
  const adminSupportDetail = readFileSync(
    "src/app/(workspace)/admin/support/[id]/page.tsx",
    "utf8",
  );
  const adminStyles = readFileSync("src/components/admin-styles.ts", "utf8");
  const adminCatalogForms = readFileSync(
    "src/features/admin-catalog/ui/forms.tsx",
    "utf8",
  );
  const adminModal = readFileSync("src/components/admin-modal.tsx", "utf8");
  const uiIcon = readFileSync("src/components/ui-icon.tsx", "utf8");
  const accountActions = readFileSync(
    "src/features/account/account-actions.tsx",
    "utf8",
  );
  const packagesPage = readFileSync(
    "src/app/(public)/packages/page.tsx",
    "utf8",
  );
  const packageDetail = readFileSync(
    "src/app/(public)/packages/[slug]/page.tsx",
    "utf8",
  );
  const productDetailTabs = readFileSync(
    "src/features/catalog/ui/product-detail-tabs.tsx",
    "utf8",
  );
  const catalogFilterDisclosure = readFileSync(
    "src/features/catalog/ui/catalog-filter-disclosure.tsx",
    "utf8",
  );
  const publicLayout = readFileSync("src/app/(public)/layout.tsx", "utf8");
  const authForm = readFileSync("src/features/auth/ui/auth-form.tsx", "utf8");
  const storefrontProductCard = readFileSync(
    "src/components/storefront-product-card.tsx",
    "utf8",
  );
  const publicSearch = readFileSync("src/components/public-search.tsx", "utf8");
  const homePage = readFileSync("src/app/(public)/page.tsx", "utf8");
  const cartWorkflow = readFileSync(
    "src/features/commerce/ui/cart-workflow.tsx",
    "utf8",
  );
  const checkoutPage = readFileSync(
    "src/app/(public)/checkout/page.tsx",
    "utf8",
  );
  const supportDetail = readFileSync(
    "src/app/(workspace)/dashboard/support/[id]/page.tsx",
    "utf8",
  );
  const resultPage = readFileSync(
    "src/app/(workspace)/results/[id]/page.tsx",
    "utf8",
  );
  const resultReview = readFileSync(
    "src/features/student-results/result-review-table.tsx",
    "utf8",
  );
  const testRunner = readFileSync(
    "src/features/student-tests/ui/test-runner.tsx",
    "utf8",
  );
  const attemptPage = readFileSync(
    "src/app/(workspace)/attempts/[id]/page.tsx",
    "utf8",
  );
  const materialRepository = readFileSync(
    "src/features/materials/repository.ts",
    "utf8",
  );
  const courseRepository = readFileSync(
    "src/features/student-courses/repository.ts",
    "utf8",
  );
  const testRepository = readFileSync(
    "src/features/student-tests/repository.ts",
    "utf8",
  );

  it("keeps account password changes in-session and package content destinations explicit", () => {
    expect(profilePage).toContain("<ChangePasswordForm />");
    expect(profilePage).not.toContain(
      'href="/forgot-password">Change password',
    );
    expect(coursePage).toContain("?view=materials`");
    expect(coursePage).toContain("?view=tests`");
    expect(coursePage).not.toContain(
      "Package content</h2><p>Everything included",
    );
  });

  it("keeps refund navigation canonical and password guidance neutral", () => {
    expect(publicLayout).not.toContain(">Refund policy<");
    expect(
      publicLayout.match(/href="\/legal\/cancellation-refund"/g),
    ).toHaveLength(1);
    expect(authForm).toContain('aria-label="Password guidance"');
    expect(authForm).toContain("before:bg-prep-orange");
    expect(authForm).not.toContain('content: "✓"');
    expect(css).not.toContain(".password-requirements");
  });

  it("keeps product tabs inside their mobile container", () => {
    expect(productDetailTabs).toContain("max-[700px]:static");
    expect(productDetailTabs).toContain("overflow-x-auto");
    expect(productDetailTabs).toContain("max-w-full");
    expect(css).not.toContain(".reference-product-tabs");
  });

  it("limits horizontal catalogue cards to the catalogue grid", () => {
    expect(packagesPage).toContain("max-[1050px]:grid-cols-2");
    expect(packagesPage).toContain("max-[560px]:grid-cols-1");
    expect(packagesPage).toContain("max-[1100px]:grid-cols-1");
    expect(catalogFilterDisclosure).toContain("max-[1100px]:flex");
    expect(catalogFilterDisclosure).toContain("max-[1100px]:hidden");
    expect(catalogFilterDisclosure).toContain("max-[1100px]:grid-cols-2");
    expect(css).not.toContain(".reference-catalog-grid");
    expect(css).not.toContain(".store-product-catalog");
  });

  it("keeps storefront cards compact and related packages swipeable on phones", () => {
    expect(storefrontProductCard).not.toContain("product.description||");
    expect(storefrontProductCard).toContain('variant === "catalog"');
    expect(storefrontProductCard).toContain("max-[560px]:gap-[0.28rem]");
    expect(cartWorkflow).toContain("max-[560px]:grid-flow-col");
    expect(cartWorkflow).toContain("max-[560px]:overflow-x-auto");
    expect(storefrontProductCard).toContain("max-[560px]:aspect-[3/2]");
    expect(storefrontProductCard).toContain(
      "max-[560px]:grid-cols-[auto_auto_minmax(0,1fr)]",
    );
  });

  it("keeps checkout inside the same responsive commerce container as cart", () => {
    expect(checkoutPage).toContain("mx-auto");
    expect(checkoutPage).toContain("max-w-[1500px]");
    expect(checkoutPage).toContain("min-w-0");
    expect(checkoutPage).toContain("overflow-x-clip");
    expect(checkoutPage).toContain("px-[clamp(1rem,4vw,4rem)]");
    expect(cartWorkflow).toContain("max-[800px]:grid-cols-1");
    expect(cartWorkflow).toContain("[&>*]:min-w-0");
    expect(cartWorkflow).toContain(
      "max-[560px]:grid-cols-[3.5rem_minmax(0,1fr)]",
    );
  });

  it("sizes package details from content without duplicate divider bands", () => {
    expect(productDetailTabs).toContain("min-h-0 bg-white py-5");
    expect(packageDetail).toContain("mt-[0.35rem] border-t");
    expect(css).not.toContain(".reference-product-panel");
    expect(css).not.toContain(".reference-related");
  });

  it("anchors mobile hero search and uses the shared responsive carousel", () => {
    expect(homePage).toContain("max-[560px]:absolute max-[560px]:inset-0");
    expect(homePage).toContain("max-[560px]:bottom-[0.7rem]");
    expect(heroCarousel).toContain("[touch-action:pan-y]");
    expect(heroCarousel).toContain("motion-reduce:transition-none");
    expect(heroCarousel.match(/home-[a-z-]+\.webp/g)).toHaveLength(8);
    expect(heroCarousel.match(/student-[a-z-]+\.webp/g)).toHaveLength(8);
    expect(heroCarousel.match(/student-[a-z-]+-desktop\.webp/g)).toHaveLength(
      4,
    );
    expect(heroCarousel.match(/home-[a-z-]+-responsive\.webp/g)).toHaveLength(
      4,
    );
    expect(heroCarousel).toContain('<source media="(min-width: 900px)"');
    expect(heroCarousel).toContain('media="(max-width: 899px)"');
    expect(heroCarousel).toContain(
      'sizes="(max-width: 899px) 100vw, calc(100vw - 240px)"',
    );
    expect(homePage).not.toContain("[&>*:last-child]:hidden");
    expect(css).not.toContain(
      "@media(max-width:950px){.course-outline{position:static}.auth-shell",
    );
    expect(css).not.toContain(".featured-store-grid");
    expect(heroCarousel).toContain(
      'fetchPriority={index === 0 ? "high" : "auto"}',
    );
    expect(heroCarousel).toContain("document.visibilityState");
    expect(heroCarousel).not.toContain("controls=");
    expect(heroCarousel).toContain("onPointerUp={handlePointerUp}");
    expect(heroCarousel).toContain("if (distance > 0) showPrevious();");
    expect(heroCarousel).toContain("else showNext();");
    expect(heroCarousel).not.toContain("ArrowIcon");
    expect(heroCarousel).not.toContain("PauseIcon");
    expect(heroCarousel).toContain('aria-live="polite"');
    expect(heroCarousel.indexOf('aria-label="Choose an image"')).toBeLessThan(
      heroCarousel.indexOf('aria-live="polite"'),
    );
    expect(heroCarousel).toContain("unoptimized");
    expect(heroCarousel).toContain("object-cover object-right");
    expect(heroCarousel).toContain(
      "bottom-[6.35rem] left-[clamp(1rem,7vw,7.2rem)]",
    );
    expect(heroCarousel).toContain("max-[560px]:bottom-[3.72rem]");
    expect(heroCarousel).toContain("window.setTimeout(showNext, intervalMs)");
    expect(heroCarousel).toContain("duration-[420ms]");
    expect(heroCarousel).toContain('loading={index < 2 ? "eager" : "lazy"}');
    expect(homePage).toContain("min-[561px]:bottom-8");
    expect(homePage).toContain("min-[561px]:left-[clamp(2rem,7vw,7.2rem)]");
    expect(css).not.toContain(".hero-carousel");
    expect(css).not.toContain(".student-reference-banner:after");
    expect(css).not.toContain(".student-reference-banner:after");
    expect(css).not.toContain(".student-reference-banner::after");
    expect(css).not.toContain(".store-hero:after");
    expect(css).not.toContain(".store-hero::after");
    expect(studentDashboard).toContain("min-[801px]:min-h-[18.5rem]");
    expect(studentDashboard).toContain("max-[600px]:min-h-72");
    expect(studentDashboard).toContain("max-[560px]:w-[62%]");
    expect(css).not.toContain(".student-reference-banner");
    expect(studentDashboard).toContain(
      'mainClassName="student-dashboard-main"',
    );
    expect(studentDashboard).toContain("mx-auto w-full max-w-[1240px]");
    expect(css).not.toContain(".student-dashboard-content");
    expect(workspaceShell).toContain("mainClassName?: string");
    expect(workspaceShell).toContain(
      '"workspace-main student-dashboard-main min-w-0 w-full max-w-none',
    );
    expect(heroCarousel).not.toContain("hero-handwriting");
  });

  it("keeps shared admin icons compact and lowers the student hero action", () => {
    expect(uiIcon).toContain("size-4 shrink-0");
    expect(studentDashboard.match(/className="mt-8 inline-flex/g)).toHaveLength(
      2,
    );
    expect(adminSupportDetail).toContain(
      'border border-[#eadfd8] bg-white p-[0.35rem]',
    );
  });

  it("renders order rows as labelled mobile cards", () => {
    expect(orders).toContain('data-label="Order ID"');
    expect(orders).toContain('data-label="Payment status"');
    expect(orders).toContain("content-[attr(data-label)]");
    expect(orders).toContain("max-[700px]:hidden");
    expect(css).not.toContain(".orders-table-wrap");
  });

  it("allows long protected-material filenames to wrap", () => {
    expect(reader).toContain("[overflow-wrap:anywhere]");
    expect(reader).toContain("min-w-0 max-w-full");
    expect(reader).toContain("break-words");
    expect(css).not.toContain(".reference-reader-content");
    expect(css).not.toContain(".reader-heading");
  });

  it("allows protected PDFs to render only inside the same-origin reader", () => {
    expect(materialContentRoute).toContain('"X-Frame-Options": "SAMEORIGIN"');
    expect(materialContentRoute).toContain("frame-ancestors 'self'");
    expect(materialContentRoute).not.toContain("default-src 'none'; sandbox");
    expect(reader).toContain("<SecurePdfViewer");
    expect(securePdfViewer).toContain('await import("pdfjs-dist")');
    expect(securePdfViewer).toContain('credentials: "same-origin"');
    expect(securePdfViewer).toContain("const task = page.render({");
    expect(securePdfViewer).toContain("canvas,");
    expect(securePdfViewer).toContain("viewport,");
    expect(securePdfViewer).not.toContain("<iframe");
    expect(securePdfViewer).not.toContain("URL.createObjectURL");
    expect(securePdfViewer).toContain("h-[calc(100dvh-9rem)]");
    expect(securePdfViewer).toContain("max-[700px]:min-h-[44rem]");
    expect(securePdfViewer).toContain("data-pdf-stage");
    expect(css).not.toContain(".secure-pdf-reader");
    expect(reader).toContain("Personal study copy · access protected");
    expect(securePdfViewer).toContain('fitMode === "page"');
    expect(securePdfViewer).toContain("availableHeight / base.height");
    expect(securePdfViewer).toContain("MAX_RENDER_PIXELS");
    expect(securePdfViewer).toContain("pixelBudgetScale");
    expect(securePdfViewer).toContain("Fit page");
    expect(securePdfViewer).toContain("Fit width");
    expect(materialAccessRoute).toContain("Location: location");
    expect(materialAccessRoute).not.toContain("Response.redirect");
    expect(materialAccessRoute).not.toContain("new URL(`/api/materials/");
    expect(materialContentRoute).toContain('"Content-Length"');
  });

  it("renders invoice items as labelled mobile rows", () => {
    expect(invoicePage).toContain('data-label="Description"');
    expect(invoicePage).toContain('data-label="Access period"');
    expect(invoicePage).toContain('data-label="Amount"');
    expect(invoicePage).toContain('<thead className="max-[700px]:hidden">');
    expect(invoicePage).toContain("before:content-[attr(data-label)]");
    expect(invoicePage).not.toContain("<PublicHeader");
    expect(invoicePage).toContain("<PrepstoreLogo");
    expect(css).toContain("@media print");
    expect(css).toContain("@page");
    expect(css).not.toContain(".invoice-page-header");
    expect(css).not.toContain(".invoice-page");
  });

  it("loads one consolidated Tailwind stylesheet without legacy layers", () => {
    expect(rootLayout).toContain('import "./tailwind.css"');
    expect(rootLayout).not.toContain('import "./styles.css"');
    expect(rootLayout).not.toContain("storefront-fixes.css");
    expect(rootLayout).not.toContain("brand-system.css");
    expect(rootLayout).not.toContain("final-review-polish.css");
    expect(css).not.toContain(".admin-list-controls");
    expect(adminOrders).toContain("adminFilterForm");
    expect(adminOrders).toContain("adminPagination");
    expect(adminOrders).toContain("const pageSize = 12");
    expect(adminOrders).toContain('aria-label="Order pages"');
    expect(adminOrders).toContain("filtered.slice(");
    expect(adminStudents).toContain("adminFilterForm");
    expect(adminCoupons).toContain("adminFilterForm");
    expect(adminStyles).toContain("export const adminSideDetail");
    expect(adminStyles).toContain("-translate-x-1/2");
    expect(adminOrders).toContain('role="dialog"');
    expect(adminOrders).toContain('aria-labelledby="order-detail-title"');
    expect(adminStudents).toContain('role="dialog"');
    expect(adminStudents).toContain('aria-labelledby="student-detail-title"');
    expect(css).not.toContain(".admin-side-detail.reference-order-detail");
    expect(adminCatalogForms).toContain(
      "flex justify-end border-t border-prep-line pt-4",
    );
    expect(css).not.toContain(".product-create-form .dialog-form-footer");
  });

  it("keeps desktop workspace dividers continuous without stretching student navigation", () => {
    expect(workspaceShell).toContain(
      "min-[1100px]:grid-cols-[minmax(240px,256px)_minmax(0,1fr)]",
    );
    expect(workspaceShell).toContain("before:top-[63px]");
    expect(workspaceShell).toContain("[&>nav]:content-start");
    expect(workspaceShell).toContain("border-b border-[#e6e2de]");
    expect(workspaceShell).toContain("border-r border-[#e6e2de]");
    expect(workspaceShell).toContain("min-[1100px]:border-l");
    expect(css).not.toContain(".student-workspace.workspace");
  });

  it("asks for confirmation before ending a signed-in session", () => {
    expect(accountActions).toContain(
      'ref={dialogRef}\n        className="m-auto max-h-none max-w-none border-0 bg-transparent p-0',
    );
    expect(accountActions).toContain("dialog.showModal()");
    expect(accountActions).toContain("aria-labelledby={titleId}");
    expect(accountActions).toContain("Sign out of Prepstore?");
    expect(accountActions).toContain("setConfirming(true)");
    expect(accountActions).toContain("backdrop:backdrop-blur-[2px]");
    expect(accountActions).toContain("max-[420px]:grid-cols-2");
    expect(css).not.toContain(".logout-confirm-dialog");
  });

  it("keeps the test title, timer and section selector compact", () => {
    expect(testRunner).toContain("max-w-[1060px]");
    expect(testRunner).toContain("min-h-[3.75rem]");
    expect(testRunner).toContain("min-w-[7.25rem]");
    expect(testRunner).toContain("min-w-[8.5rem]");
    expect(testRunner).toContain("[font-variant-numeric:tabular-nums]");
    expect(testRunner).toContain("max-[420px]:text-[1.15rem]");
    expect(css).not.toContain(".attempt-runner");
  });

  it("keeps every home shelf in one scrollable row without squeezing cards", () => {
    expect(homePage).toContain("grid grid-flow-col items-stretch");
    expect(homePage).toContain(
      "auto-cols-[minmax(17.5rem,calc((100%_-_2rem)/3))]",
    );
    expect(homePage).toContain(
      "auto-cols-[minmax(16.5rem,calc((100%_-_2.4rem)/4))]",
    );
    expect(homePage).toContain(
      "max-[560px]:auto-cols-[minmax(16.5rem,82vw)]",
    );
    expect(homePage).toContain("overflow-x-auto overflow-y-hidden");
    expect(homePage).toContain("[scrollbar-width:none]");
    expect(homePage).toContain("[&::-webkit-scrollbar]:hidden");
    expect(homePage).toContain("[scroll-snap-type:inline_mandatory]");
    expect(homePage).toContain("[&>*]:snap-start");
    expect(homePage.match(/data-home-shelf/g)).toHaveLength(3);
    expect(homePage.match(/tabIndex=\{0\}/g)).toHaveLength(3);
    expect(storefrontProductCard).toContain("<ProductCoverImage");
    expect(storefrontProductCard).not.toContain("onError");
    expect(storefrontProductCard).not.toContain(
      'variant === "compact" ? "hidden"',
    );
    expect(css).not.toContain(".store-home");
  });

  it("provides explicit package search without submitting every keystroke", () => {
    const autoSubmitForm = readFileSync(
      "src/components/auto-submit-form.tsx",
      "utf8",
    );
    expect(packagesPage).toContain('name="q"');
    expect(packagesPage).toContain('type="search"');
    expect(packagesPage).toContain('type="submit"');
    expect(packagesPage).toContain("matchesCatalogQuery(product, q)");
    expect(autoSubmitForm).toContain("HTMLSelectElement");
    expect(autoSubmitForm).toContain('["checkbox", "radio"].includes(control.type)');
    expect(autoSubmitForm).not.toContain('onInput=');
  });

  it("requires an active entitlement even for free package content", () => {
    expect(materialRepository).not.toContain("p.price_paise = 0");
    expect(courseRepository).not.toContain("or p.price_paise=0");
    expect(testRepository).not.toContain("or p.price_paise=0");
    expect(materialRepository).toContain("en.status = 'ACTIVE'");
    expect(courseRepository).toContain("e.status='ACTIVE'");
    expect(testRepository).toContain("en.status='ACTIVE'");
  });

  it("replaces submitted attempt history and redirects closed attempts to results", () => {
    expect(testRunner).toContain("router.replace(");
    expect(testRunner).toContain("`/results/${payload.data.resultId}");
    expect(attemptPage).toContain("getStudentResultForAttempt");
    expect(attemptPage).toContain("redirect(`/results/${resultId}");
  });

  it("uses a compact mobile catalogue disclosure and bounded product covers", () => {
    expect(packagesPage).toContain("<CatalogFilterDisclosure");
    expect(packagesPage).toContain("activeFilterCount");
    expect(packagesPage).not.toContain("<details");
    expect(packagesPage).not.toContain("<span>⌃</span>");
    expect(catalogFilterDisclosure).toContain("aria-expanded={open}");
    expect(catalogFilterDisclosure).toContain('type="button"');
    expect(catalogFilterDisclosure).toContain("max-[560px]:col-start-2");
    expect(catalogFilterDisclosure).toContain("max-[560px]:grid-cols-1");
    expect(catalogFilterDisclosure).toContain("max-[1100px]:static");
    expect(storefrontProductCard).toContain("max-[560px]:h-[10.75rem]");
    expect(packagesPage).toContain("max-[560px]:col-span-full");
    expect(css).not.toContain(".catalog-filter-trigger");
  });

  it("keeps mobile hero copy clear of the subject and strengthens owned actions", () => {
    expect(heroCarousel).toContain("object-cover object-right");
    expect(homePage).toContain("max-[560px]:max-w-[48%]");
    expect(homePage).toContain(
      "focus-within:shadow-[0_0_0_2px_rgba(232,71,20,.22)]",
    );
    expect(storefrontProductCard).toContain("max-[560px]:aspect-[3/2]");
    expect(storefrontProductCard).toContain(
      "bg-[#e7edf8] bg-[linear-gradient(135deg,#f9fbff_0%,#d7e1f3_52%,#7289bb_100%)]",
    );
    expect(storefrontProductCard).toContain("bg-[#c73c0b]");
  });

  it("removes reserved card-title space and keeps both support conversations compact", () => {
    expect(supportDetail).toContain(
      "max-[700px]:grid-cols-[2.2rem_minmax(0,1fr)]",
    );
    expect(supportDetail).toContain("max-[700px]:rounded-none");
    expect(css).not.toContain(".reference-ticket");
    expect(adminSupportDetail).toContain("grid-cols-[2.35rem_minmax(0,1fr)]");
    expect(adminSupportDetail).toContain("max-[700px]:max-w-full");
    expect(css).not.toContain(".admin-ticket-panel");
    expect(css).not.toContain(".support-split-detail");
  });

  it("keeps admin header account actions in a compact right-side group", () => {
    expect(workspaceShell).toContain("items-center justify-start gap-3");
    expect(workspaceShell).toContain('<PublicSearch variant="admin" />');
    expect(publicSearch).toContain('variant === "student"');
    expect(publicSearch).toContain('variant?: "public" | "student" | "admin"');
    expect(workspaceShell).toContain("hidden min-w-0 shrink-0 items-center");
    expect(css).not.toContain(".admin-workspace .workspace-header");
  });

  it("uses a compact course heading and includes the active view in breadcrumbs", () => {
    expect(coursePage).not.toContain('"MY PACKAGE"');
    expect(coursePage).toContain("<b>{viewLabel}</b>");
    expect(coursePage).toContain('view === "overview"');
    expect(coursePage).toContain('? "Overview"');
  });

  it("turns question review rows into mobile cards instead of a wide table", () => {
    expect(css).not.toContain(".review-table-wrap");
    expect(resultReview).toContain("max-[700px]:grid-cols-2");
    expect(resultReview).toContain("max-[700px]:hidden");
    expect(resultReview).toContain("Correct answer");
    expect(resultPage).toContain("max-[700px]:hidden");
    expect(resultPage).toContain("max-[500px]:grid-cols-2");
  });

  it("uses semantic status colours instead of falling back to grey", () => {
    expect(adminStyles).toContain(
      '["ACTIVE", "PAID", "ENABLED", "RESOLVED", "CAPTURED", "COMPLETED"]',
    );
    expect(adminStyles).toContain('"PENDING_VERIFICATION"');
    expect(adminStyles).toContain(
      '["FAILED", "SUSPENDED", "BLOCKED", "REJECTED"]',
    );
    expect(adminStyles).toContain('["REFUNDED", "PARTIALLY_REFUNDED"]');
    expect(profilePage).toContain(
      "border-[#bfe2cc] bg-[#e7f4ec] text-[#276448]",
    );
    expect(profilePage).toContain(
      "border-[#f1d79b] bg-[#fff4d9] text-[#8a5b13]",
    );
  });

  it("keeps workspace forms and dialogs bounded at desktop and mobile sizes", () => {
    expect(accountActions).toContain(
      'className="m-0 grid grid-cols-2 gap-[.7rem] border-0 p-0 max-[700px]:grid-cols-1',
    );
    expect(css).not.toContain(".change-password-form");
    expect(adminModal).toContain("w-[min(64rem,calc(100vw-2rem))]");
    expect(adminModal).toContain("max-h-[calc(100dvh-2rem)]");
    expect(adminModal).toContain("min-h-0 overflow-y-auto overscroll-contain");
    expect(css).not.toContain(".admin-dialog");
    expect(css).not.toContain(".dialog-body");
    expect(studentActions).toContain(
      'className="m-0 grid grid-cols-2 gap-[.85rem] border-0 p-0 max-[700px]:grid-cols-1"',
    );
    expect(studentActions).toContain("max-[700px]:w-full");
    expect(css).not.toContain(".support-ticket-create-form");
    expect(adminCatalogForms).toContain(
      "file:cursor-pointer file:rounded-[0.35rem]",
    );
    expect(css).not.toContain('.cover-upload-field input[type="file"]');
  });

  it("keeps test editing compact and uses the primary save action", () => {
    expect(testForms).toContain("min-h-28 w-full resize-y");
    expect(testForms).toContain("grid grid-cols-2 gap-x-4");
    expect(testForms).toContain("adminPrimaryButton");
    expect(css).not.toContain(".test-create-workspace");
    expect(css).not.toContain(".test-settings-card");
    expect(testForms).toContain(
      '{busy === "settings" ? "Saving…" : "Save settings"}',
    );
    expect(testForms).not.toContain(
      '<button className="button secondary" type="submit">\n                {busy === "settings"',
    );
  });

  it("keeps wide admin tables scrollable and switches to labelled cards", () => {
    expect(adminOrders).toContain(
      "overflow-x-auto max-[800px]:overflow-visible",
    );
    expect(adminStudents).toContain(
      "overflow-x-auto max-[800px]:overflow-visible",
    );
    expect(adminStyles).toContain("max-[800px]:[&_thead]:hidden");
    expect(adminStyles).toContain(
      "max-[800px]:[&_td]:before:content-[attr(data-label)]",
    );
  });

  it("turns dense admin lists into labelled cards on phones", () => {
    expect(adminOrders).toContain('data-label="Order ID"');
    expect(adminStudents).toContain('data-label="Account status"');
    expect(adminCoupons).toContain('data-label="Discount"');
    expect(adminNotifications).toContain('data-label="Recipients"');
    expect(adminOrders).toContain("adminResponsiveTable");
    expect(adminStudents).toContain("adminResponsiveTable");
    expect(adminNotifications).toContain("adminResponsiveTable");
    expect(adminStyles).toContain("before:content-[attr(data-label)]");
    expect(css).not.toContain(".reference-order-card .admin-table td::before");
  });

  it("protects changed modal forms from accidental dismissal", () => {
    expect(adminModal).toContain("Discard your unsaved changes?");
    expect(adminModal).toContain("onCancel=");
    expect(adminModal).toContain("onInputCapture=");
  });
});
