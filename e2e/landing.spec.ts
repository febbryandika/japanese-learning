import { test, expect } from '@playwright/test'

import { createUserViaDb, loginViaUi } from './helpers/users'

test('guest sees the landing page and can reach sign in', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Systematic JLPT N2 preparation, in one place.' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('signed-in user visiting / is redirected to /dashboard', async ({ page }) => {
  const email = `e2e+landing+${Date.now()}@example.com`
  await createUserViaDb({ name: 'E2E Landing User', email, password: 'password1234' })
  await loginViaUi(page, { email, password: 'password1234' })

  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
})
