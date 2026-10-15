import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("responsive content integrity", () => {
  const css = readFileSync("src/app/styles.css", "utf8");
  const storefrontFixes = readFileSync("src/app/storefront-fixes.css", "utf8");
  const finalReviewPolish = readFileSync(
    "src/app/final-review-polish.css",
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

  it("keeps product tabs inside their mobile container", () => {
    expect(css).not.toContain(
      ".reference-product-tabs{margin-inline:-1.25rem;padding-inline:1.25rem}",
    );
    expect(css).toContain(".reference-product-tabs{position:static;display:flex;width:100%");
  });

  it("limits horizontal catalogue cards to the catalogue grid", () => {
    expect(storefrontFixes).toContain(
      ".reference-catalog-grid .store-product-catalog",
    );
    expect(storefrontFixes).not.toContain(
      ".store-product-card{border-radius:.55rem}.store-product-catalog{",
    );
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
  });

  it("renders invoice items as labelled mobile rows", () => {
    expect(invoicePage).toContain('data-label="Description"');
    expect(invoicePage).toContain('data-label="Access period"');
    expect(invoicePage).toContain('data-label="Amount"');
    expect(css).toContain(".invoice-page .invoice thead{display:none}");
    expect(invoicePage).not.toContain("<PublicHeader");
    expect(invoicePage).toContain("<PrepstoreLogo");
    expect(finalReviewPolish).toContain(".invoice-page-header");
    expect(finalReviewPolish).toContain("@media print");
    expect(finalReviewPolish).toContain(".invoice-page-header,");
  });

  it("loads the screenshot-review overrides after the shared brand rules", () => {
    expect(rootLayout.indexOf('import "./brand-system.css"')).toBeLessThan(
      rootLayout.indexOf('import "./final-review-polish.css"'),
    );
    expect(finalReviewPolish).toContain(".admin-workspace .admin-list-controls");
    expect(finalReviewPolish).toContain(".admin-side-detail.reference-order-detail");
    expect(finalReviewPolish).toContain(".product-create-form .dialog-form-footer");
  });

  it("keeps desktop workspace dividers continuous without stretching student navigation", () => {
    expect(finalReviewPolish).toContain(".admin-workspace > .sidebar::before");
    expect(finalReviewPolish).toContain(".student-workspace > .sidebar::before");
    expect(finalReviewPolish).toContain("top: 63px");
    expect(finalReviewPolish).toContain("grid-auto-rows: max-content");
    expect(finalReviewPolish).toContain("align-content: start");
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
    expect(css).toContain(".admin-workspace .admin-dialog.dialog-large{width:min(55rem");
    expect(css).toContain("max-height:calc(100dvh - 2rem)");
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
    expect(finalReviewPolish).toContain(
      ".reference-order-card .admin-table td::before",
    );
    expect(finalReviewPolish).toContain("content: attr(data-label)");
  });

  it("protects changed modal forms from accidental dismissal", () => {
    expect(adminModal).toContain("Discard your unsaved changes?");
    expect(adminModal).toContain("onCancel=");
    expect(adminModal).toContain("onInputCapture=");
  });
});
