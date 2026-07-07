import { test, expect } from '@playwright/test'

import { createUserViaDb, loginViaUi } from './helpers/users'

test('guest is redirected from /dashboard to /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('login → dashboard → logout → login → dashboard', async ({ page }) => {
  const name = 'E2E User'
  const email = `e2e+${Date.now()}@example.com`
  const password = 'password1234'

  // Public registration is removed (Phase 16) — provision the user directly
  // in the DB via the same path the admin UI uses, then log in via the UI.
  await createUserViaDb({ name, email, password })
  await loginViaUi(page, { email, password })

  // The dashboard greets by name in its heading (Sumi Night design).
  await expect(
    page.getByRole('heading', { name: `Welcome back, ${name}` }),
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

test('/register no longer exists', async ({ page }) => {
  const response = await page.goto('/register')
  expect(response?.status()).toBe(404)
})

test('public sign-up API is rejected', async ({ page }) => {
  const email = `e2e+signup+${Date.now()}@example.com`
  const response = await page.request.post('/api/auth/sign-up/email', {
    data: { name: 'Blocked User', email, password: 'password1234' },
  })

  expect(response.ok()).toBe(false)
  expect(response.status()).toBeGreaterThanOrEqual(400)
  expect(response.status()).toBeLessThan(500)
})
