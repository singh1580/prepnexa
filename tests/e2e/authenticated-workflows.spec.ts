import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

type WorkflowFixture = {
  productSlug: string;
  orderId: string;
  materialId: string;
  testId: string;
};

const studentState = process.env.E2E_STUDENT_STORAGE_STATE;
const adminState = process.env.E2E_ADMIN_STORAGE_STATE;
const fixturePath = process.env.E2E_WORKFLOW_FIXTURE;
const fixture = fixturePath
  ? (JSON.parse(readFileSync(fixturePath, "utf8")) as WorkflowFixture)
  : null;

async function expectNoSeriousAccessibilityViolations(
  page: Page,
) {
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    report.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
}

test.describe("authenticated Student workflow pages", () => {
  test.skip(
    !studentState || !fixture,
    "Set the Student storage state and seeded workflow fixture.",
  );
  test.use({ storageState: studentState || { cookies: [], origins: [] } });

  test("payment receipt remains usable and responsive", async ({ page }) => {
    await page.goto(`/invoice/${fixture!.orderId}`);
    await expect(
      page.getByRole("heading", { name: "Payment receipt" }),
    ).toBeVisible();
    await expect(page.getByText("Prepstore QA Workflow Package")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("protected PDF renders a complete A4 page without browser controls", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto(
      `/library/${fixture!.materialId}?course=${encodeURIComponent(fixture!.productSlug)}`,
    );
    const reader = page.getByRole("region", {
      name: /Secure document reader:/,
    });
    const canvas = page.getByRole("img", {
      name: /Prepstore QA Study Guide, page 1 of 2/,
    });
    await expect(reader).toBeVisible();
    await expect(canvas).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled({
      timeout: 120_000,
    });
    await expect(
      page.getByText("Personal study copy", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /print|download/i }),
    ).toHaveCount(0);

    const dimensions = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("[data-pdf-stage]");
      const canvasElement = stage?.querySelector("canvas");
      if (!stage || !canvasElement) return null;
      const stageBox = stage.getBoundingClientRect();
      const canvasBox = canvasElement.getBoundingClientRect();
      return {
        stageWidth: stageBox.width,
        stageHeight: stageBox.height,
        canvasWidth: canvasBox.width,
        canvasHeight: canvasBox.height,
      };
    });
    expect(dimensions).not.toBeNull();
    expect(dimensions!.canvasWidth).toBeGreaterThan(180);
    expect(dimensions!.canvasHeight).toBeGreaterThan(250);
    expect(dimensions!.canvasWidth / dimensions!.canvasHeight).toBeCloseTo(
      595.28 / 841.89,
      1,
    );
    expect(dimensions!.canvasWidth).toBeLessThanOrEqual(
      dimensions!.stageWidth,
    );
    expect(dimensions!.canvasHeight).toBeLessThanOrEqual(
      dimensions!.stageHeight,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(
      page.getByRole("img", {
        name: /Prepstore QA Study Guide, page 2 of 2/,
      }),
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
  });

  test("test answer autosaves and survives refresh", async ({
    page,
  }, testInfo) => {
    test.setTimeout(360_000);
    test.skip(
      testInfo.project.name !== "laptop-1366",
      "The state-mutating autosave proof runs once on laptop.",
    );
    await page.goto(
      `/tests/${fixture!.testId}?course=${encodeURIComponent(fixture!.productSlug)}`,
    );
    await page.getByLabel(/I have read and understood/).check();
    await page.getByRole("button", { name: /Start test|Resume attempt/ }).click();
    await expect(page).toHaveURL(/\/attempts\/[0-9a-f-]+/, {
      timeout: 120_000,
    });
    const answers = page.getByRole("radio");
    const selectedIndex = (await answers.nth(1).isChecked()) ? 0 : 1;
    await answers.nth(selectedIndex).check();
    await expect(page.getByText("Saving…", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Saved", { exact: true })).toBeVisible({
      timeout: 120_000,
    });
    await page.reload();
    await expect(page.getByRole("radio").nth(selectedIndex)).toBeChecked();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  });
});

test.describe("keyboard and dialog behaviour", () => {
  test("missing product covers use a fallback instead of a broken image", async (
    { browser },
    testInfo,
  ) => {
    test.skip(
      !adminState || testInfo.project.name !== "laptop-1366",
      "Set the Admin storage state; cover fallback proof runs once on laptop.",
    );
    const context = await browser.newContext({ storageState: adminState! });
    const page = await context.newPage();
    const staleCoverProductId = "568569e1-7513-405b-a841-9feb54665ff5";
    const coverResponse = await context.request.get(
      `/api/catalog/products/${staleCoverProductId}/cover`,
    );
    expect(coverResponse.status()).toBe(404);
    await page.goto(`/admin/packages/${staleCoverProductId}`);
    await expect(page.locator("main#main-content")).toBeVisible();
    await page.waitForTimeout(1_000);
    expect(
      await page.locator("img").evaluateAll((images) =>
        images.filter((node) => {
          const image = node as HTMLImageElement;
          return (
            image.complete &&
            image.naturalWidth === 0 &&
            !image.getAttribute("src")?.endsWith(".svg")
          );
        }).length,
      ),
    ).toBe(0);
    await context.close();
  });

  test("Admin dialog traps focus and closes with Escape", async (
    { browser },
    testInfo,
  ) => {
    test.skip(
      !adminState || testInfo.project.name !== "laptop-1366",
      "Set the Admin storage state; keyboard proof runs once on laptop.",
    );
    const context = await browser.newContext({ storageState: adminState! });
    const page = await context.newPage();
    await page.goto("/admin/notifications");
    await page.getByRole("button", { name: "Send notification" }).click();
    const dialog = page.getByRole("dialog", { name: "Send notification" });
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await context.close();
  });

  test("logout blocks protected history after Back", async (
    { browser },
    testInfo,
  ) => {
    test.setTimeout(240_000);
    test.skip(
      process.env.E2E_RUN_LOGOUT !== "true" ||
        !studentState ||
        testInfo.project.name !== "laptop-1366",
      "Opt in to the destructive session/logout proof after other checks.",
    );
    const context = await browser.newContext({ storageState: studentState! });
    const page = await context.newPage();
    await page.goto("/dashboard");
    await page.goto("/account/profile");
    const signOut = page.getByRole("button", { name: "Sign out" }).first();
    await signOut.click();
    const dialog = page.getByRole("dialog", { name: "Sign out of Prepstore?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 90_000 });
    await page.goBack({ waitUntil: "commit" }).catch(() => null);
    await expect(page).toHaveURL(/\/login\?reason=session/, {
      timeout: 90_000,
    });
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Workspace" })).toHaveCount(
      0,
    );
    await context.close();
  });
});
