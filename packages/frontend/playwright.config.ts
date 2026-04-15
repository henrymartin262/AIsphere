import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/report", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "pnpm dev",
      cwd: "../../packages/backend",
      port: 4000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm dev",
      cwd: ".",
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
