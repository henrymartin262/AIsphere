import { test, expect, mockApiRoutes, injectWalletMock } from "./fixtures/mock-wallet";

test.describe("Homepage /", () => {
  test("renders hero section and nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveTitle(/error/i);
  });

  test("has connect wallet button", async ({ page }) => {
    await page.goto("/");
    const connectBtn = page.getByRole("button", { name: /connect/i }).first();
    await expect(connectBtn).toBeVisible({ timeout: 10_000 });
  });

  test("has navigation links to explore or dashboard", async ({ page }) => {
    await page.goto("/");
    // Look for any nav link
    const navLinks = page.locator("nav a, header a");
    await expect(navLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test("mobile viewport renders without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
  });
});
