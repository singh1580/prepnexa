import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const studentState = process.env.E2E_STUDENT_STORAGE_STATE;
const adminState = process.env.E2E_ADMIN_STORAGE_STATE;

test.describe("authenticated Student pages", () => {
  test.skip(!studentState, "Set E2E_STUDENT_STORAGE_STATE to a dedicated Student Playwright storage-state file.");
  test.use({ storageState: studentState || { cookies: [], origins: [] } });

  for (const path of ["/dashboard", "/dashboard/courses", "/dashboard/library", "/dashboard/tests", "/dashboard/results", "/dashboard/orders", "/dashboard/reviews", "/dashboard/notifications", "/dashboard/support", "/account/profile"]) {
    test(`${path} remains responsive and accessible`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main#main-content")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(report.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
    });
  }
});

test.describe("authenticated Admin pages", () => {
  test.skip(!adminState, "Set E2E_ADMIN_STORAGE_STATE to a dedicated MFA-authenticated Admin Playwright storage-state file.");
  test.use({ storageState: adminState || { cookies: [], origins: [] } });

  for (const path of ["/admin", "/admin/materials", "/admin/tests", "/admin/packages", "/admin/reviews", "/admin/coupons", "/admin/orders", "/admin/students", "/admin/support", "/admin/notifications"]) {
    test(`${path} remains responsive and accessible`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main#main-content")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
      const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(report.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
    });
  }
});
