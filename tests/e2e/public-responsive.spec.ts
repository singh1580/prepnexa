import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicPages = [
  { path: "/", heading: /find the right package/i },
  { path: "/packages", heading: /all packages/i },
  { path: "/cart", heading: /your cart/i },
  { path: "/checkout", heading: /preparing checkout|your cart is empty|checkout/i },
  { path: "/login", heading: /welcome back/i },
  { path: "/signup", heading: /create your account/i },
  { path: "/forgot-password", heading: /forgot your password/i },
  { path: "/verify-email", heading: /check your email/i },
  { path: "/contact", heading: /we're here to help/i },
  { path: "/legal/terms", heading: /terms of service/i },
  { path: "/legal/privacy", heading: /privacy policy/i },
  { path: "/legal/cancellation-refund", heading: /cancellation and refund policy/i },
  { path: "/legal/fair-use", heading: /fair use policy/i },
];

for (const entry of publicPages) {
  test(`${entry.path} has no horizontal page overflow or serious accessibility violations`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.getByRole("heading", { level: 1, name: entry.heading })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    expect(dimensions.brokenImages).toBe(0);
    const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(report.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  });
}

test("keyboard users can skip repeated navigation", async ({ page }) => {
  await page.goto("/contact");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("registration exposes required legal consent and working policy links", async ({ page }) => {
  await page.goto("/signup");
  const consent = page.getByRole("checkbox", { name: /I agree to/i });
  await expect(consent).toBeVisible();
  await expect(consent).toHaveAttribute("required", "");
  for (const name of [/Terms of service/i, /Privacy policy/i, /Cancellation & refund policy/i, /Fair use policy/i]) {
    await expect(page.getByRole("link", { name })).toHaveAttribute("href", /^\/legal\//);
  }
});
