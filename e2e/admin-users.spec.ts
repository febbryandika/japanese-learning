import { test, expect } from '@playwright/test'

import { createUserViaDb, loginViaUi } from './helpers/users'

// Full Phase 16 journey: admin provisions a learner, the learner can use the
// app but not the admin APIs, password reset takes effect, and disabling the
// account blocks login. Runs across two browser contexts (admin + learner).
test('admin creates, resets password for, and disables a learner', async ({
  browser,
  page,
}) => {
  test.setTimeout(120_000)

  const stamp = Date.now()
  const admin = {
    name: 'E2E Admin',
    email: `e2e+admin+${stamp}@example.com`,
    password: 'password1234',
  }
  const learner = {
    name: 'E2E Managed Learner',
    email: `e2e+managed+${stamp}@example.com`,
    password: 'password1234',
  }
  const resetPassword = 'newpassword5678'

  // The only admin bootstrap path is server-side provisioning (no public
  // registration, no public admin creation).
  await createUserViaDb({ ...admin, role: 'admin' })
  await loginViaUi(page, admin)

  // Admin creates the learner through the UI.
  await page.goto('/admin/users')
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  await page.getByRole('link', { name: 'New user' }).click()
  await expect(page).toHaveURL(/\/admin\/users\/new$/)

  await page.getByLabel('Name').fill(learner.name)
  await page.getByLabel('Email').fill(learner.email)
  await page.getByLabel('Password').fill(learner.password)
  // Role select defaults to Learner — leave it.
  await page.getByRole('button', { name: 'Create user' }).click()

  await expect(page).toHaveURL(/\/admin\/users$/)
  await page.getByLabel('Search users').fill(learner.email)
  // filter({ hasText }) does literal substring matching — the e2e emails
  // contain `+`, which a RegExp-based row name would misread as a quantifier.
  const learnerRow = page.getByRole('row').filter({ hasText: learner.email })
  await expect(learnerRow).toBeVisible()
  await expect(learnerRow.getByText('Active')).toBeVisible()

  // The learner can log in and use the app, but admin APIs return 403.
  const learnerContext = await browser.newContext()
  const learnerPage = await learnerContext.newPage()
  await loginViaUi(learnerPage, learner)
  await expect(
    learnerPage.getByRole('heading', { name: `Welcome back, ${learner.name}` }),
  ).toBeVisible()

  const forbidden = await learnerPage.request.get('/api/admin/users')
  expect(forbidden.status()).toBe(403)

  // Admin resets the learner's password (manual mode).
  await learnerRow.getByRole('button', { name: 'Reset password' }).click()
  await page.getByRole('button', { name: 'Set password manually' }).click()
  await page.getByLabel('New password').fill(resetPassword)
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page.getByText('Password updated')).toBeVisible()

  // The new password works.
  await learnerPage.getByRole('button', { name: 'Sign out' }).click()
  await expect(learnerPage).toHaveURL(/\/login$/)
  await loginViaUi(learnerPage, { email: learner.email, password: resetPassword })

  // Admin disables the learner via the edit page.
  await learnerRow.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByRole('heading', { name: 'Edit user' })).toBeVisible()
  await page.locator('#u-status').click()
  await page.getByRole('option', { name: 'Disabled' }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page).toHaveURL(/\/admin\/users$/)

  await page.getByLabel('Search users').fill(learner.email)
  await expect(learnerRow.getByText('Disabled')).toBeVisible()

  // Disabled accounts cannot start a new session; the login form surfaces the
  // hook's message. (Disabling also revoked the learner's live sessions.)
  await learnerPage.goto('/login')
  await learnerPage.getByLabel('Email').fill(learner.email)
  await learnerPage.getByLabel('Password').fill(resetPassword)
  await learnerPage.getByRole('button', { name: 'Sign in' }).click()
  await expect(
    learnerPage.getByText('This account has been disabled.'),
  ).toBeVisible()
  await expect(learnerPage).toHaveURL(/\/login$/)

  await learnerContext.close()
})
