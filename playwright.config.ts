import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Run serially. Each spec registers a fresh user, and several concurrent
  // sign-ups (multi-write auth transactions) overwhelm the Neon serverless pool
  // against a single dev server, hanging `signUp.email`. One worker keeps
  // registration reliable; the suite is small enough that serial is fine.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    navigationTimeout: 60_000,
  },
  expect: { timeout: 15_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // .env points BETTER_AUTH_URL at the https production deployment, which
    // makes Better Auth emit __Secure- cookies the browser refuses to store on
    // http://localhost — every UI login then silently bounces back to /login.
    // Pin the e2e server to the local origin so cookies stay non-secure.
    env: { BETTER_AUTH_URL: 'http://localhost:3000' },
  },
})
