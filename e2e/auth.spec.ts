import { test, expect } from '@playwright/test'

test('guest is redirected from /dashboard to /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('register → dashboard → logout → login → dashboard', async ({ page }) => {
  const name = 'E2E User'
  const email = `e2e+${Date.now()}@example.com`
  const password = 'password1234'

  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  await page.goto('/register')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText(`Welcome back, ${name}`)).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Dashboard' }),
  ).toBeVisible()

  // Log out — protected route should bounce back to login.
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)

  // Log back in with the same credentials.
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText(`Welcome back, ${name}`)).toBeVisible()
})
