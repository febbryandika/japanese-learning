import { test, expect } from '@playwright/test'

// Depends on `pnpm db:seed:videos` having run: the 文法 (bunpou) group must
// exist and contain the "N2文法 入門" lesson.
test('browse groups → open lesson → mark completed → persists on reload', async ({
  page,
}) => {
  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  const email = `e2e+videos+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Video User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password1234')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // Group list → open the 文法 group.
  await page.goto('/videos')
  await expect(
    page.getByRole('heading', { name: 'Video Lessons' }),
  ).toBeVisible()
  await page.getByRole('link', { name: /文法/ }).click()
  await expect(page).toHaveURL(/\/videos\/bunpou$/)

  // Lesson list → open the first lesson.
  await page.getByRole('link', { name: /N2文法 入門/ }).click()

  // Lesson detail: embed + title + initial "Not started" state in the selector.
  await expect(
    page.getByRole('heading', { name: 'N2文法 入門' }),
  ).toBeVisible()
  await expect(page.locator('iframe')).toBeVisible()
  const progressSelector = page.getByRole('combobox', {
    name: 'Set progress state',
  })
  await expect(progressSelector).toContainText('Not started')

  // Mark completed via the progress selector, waiting for the server write.
  const progressSaved = page.waitForResponse(
    (res) =>
      res.url().includes('/progress') && res.request().method() === 'PATCH',
  )
  await progressSelector.click()
  await page.getByRole('option', { name: 'Completed' }).click()
  await progressSaved
  await expect(progressSelector).toContainText('Completed')

  // Progress persists across a full reload (read back from the DB).
  await page.reload()
  await expect(progressSelector).toContainText('Completed')
})
