import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? "3120");
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npx next start -p ${port}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      APP_ENV: "demo",
      NEXT_PUBLIC_SITE_URL: baseURL,
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      SESSION_SECRET:
        process.env.SESSION_SECRET ??
        "goodform-e2e-session-secret-minimum-32-chars-2026",
    },
  },
});
