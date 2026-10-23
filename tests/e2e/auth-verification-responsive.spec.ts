import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("email OTP verification is responsive, accessible and automatically submits six digits", async ({ page }) => {
  await page.route("**/api/auth/verify-email", async route => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toEqual({ email: "learner@example.com", code: "482915" });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { verified: true }, meta: { requestId: "e2e" } }) });
  });
  await page.goto("/verify-email?email=learner%40example.com");
  await expect(page.getByRole("heading", { level: 1, name: "Check your email" })).toBeVisible();
  const code = page.getByRole("textbox", { name: /6-digit verification code/i });
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await code.fill("482915");
  await expect(page.getByRole("heading", { level: 1, name: "Account activated" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to sign in" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(report.violations.filter(violation => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("registration keeps consent and all account fields usable without horizontal overflow", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("textbox", { name: "Full name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(page.getByLabel("Create password")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /I agree to/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
