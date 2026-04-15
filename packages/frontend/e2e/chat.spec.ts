import { test, expect } from "./fixtures/mock-wallet";

test.describe("Chat /agent/8/chat", () => {
  test("renders chat page without error", async ({ authedPage: page }) => {
    await page.goto("/agent/8/chat");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveTitle(/error/i);
  });

  test("has textarea input for chat", async ({ authedPage: page }) => {
    await page.goto("/agent/8/chat");
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
  });

  test("has send button", async ({ authedPage: page }) => {
    await page.goto("/agent/8/chat");
    await page.waitForLoadState("networkidle");
    const sendBtn = page.getByRole("button", { name: /send|发送/i }).first();
    await expect(sendBtn).toBeVisible({ timeout: 10_000 });
  });

  test("new chat button exists in UI", async ({ authedPage: page }) => {
    await page.goto("/agent/8/chat");
    await page.waitForTimeout(1000);
    // + button (title attr) or text "New"
    const newBtn = page.locator("button[title*='New'], button[title*='新建'], button[title*='new']")
      .or(page.getByRole("button", { name: /new|新建|\+/i }))
      .first();
    await expect(newBtn).toBeVisible({ timeout: 10_000 });
  });

  test("typing in textarea works", async ({ authedPage: page }) => {
    await page.goto("/agent/8/chat");
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill("Hello E2E test");
    await expect(textarea).toHaveValue("Hello E2E test");
  });

  test("send clears textarea (Enter key)", async ({ authedPage: page }) => {
    await page.goto("/agent/8/chat");
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill("Test clear message");
    // Use Enter key to send (works regardless of wallet connection state)
    await textarea.press("Enter");
    // Input cleared immediately after send
    await expect(textarea).toHaveValue("", { timeout: 5_000 });
  });

  test("textarea is never disabled (Enter key send)", async ({ authedPage: page }) => {
    // Override chat to be slow
    await page.route(/\/api\/chat\/\d+$/, async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 2000));
        await route.fulfill({
          json: { success: true, data: {
            response: "Slow reply",
            proof: { proofHash: "0x1", teeVerified: false, timestamp: Date.now(), inferenceMode: "mock" },
          }},
        });
      } else { await route.continue(); }
    });

    await page.goto("/agent/8/chat");
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 15_000 });
    await textarea.fill("Trigger slow reply");
    await textarea.press("Enter");
    // Textarea must remain enabled (not disabled) during AI reply
    await expect(textarea).not.toBeDisabled();
  });
});
