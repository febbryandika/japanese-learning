import { test, expect } from '@playwright/test'

// Depends on `pnpm db:seed:mock-exams` having run: at least the published
// "JLPT N2 Mock Exam 1" with multiple-choice questions across sections.

test('guest is redirected from /mock-exams to /login', async ({ page }) => {
  await page.goto('/mock-exams')
  await expect(page).toHaveURL(/\/login$/)
})

test('start → answer → save on navigate → resume → submit → score → review', async ({
  page,
}) => {
  // Heavy end-to-end flow (register → start → save → resume → submit → review)
  // with on-demand dev compilation per route; the default 30s is too tight.
  test.setTimeout(90_000)

  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  const email = `e2e+exam+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Exam User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password1234')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // List page → open the full mock exam.
  await page.goto('/mock-exams')
  await expect(page.getByRole('heading', { name: 'Mock Exams' })).toBeVisible()
  await page.getByRole('link', { name: /JLPT N2 Mock Exam 1/ }).click()

  // Detail page → start an attempt.
  await expect(page.getByRole('button', { name: 'Start exam' })).toBeVisible()
  await page.getByRole('button', { name: 'Start exam' }).click()

  // Attempt page: timer + first question render.
  await expect(page).toHaveURL(/\/mock-exams\/[^/]+\/attempt\/[^/]+$/)
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(page.getByText(/Question 1 of/)).toBeVisible()
  const attemptUrl = page.url()

  // Answer Q1, then advance — the save PATCH must fire on navigation.
  await page.locator('label:has(input[type="radio"])').first().click()
  await Promise.all([
    page.waitForResponse(
      (res) =>
        /\/api\/mock-exam-attempts\/[^/]+$/.test(res.url()) &&
        res.request().method() === 'PATCH' &&
        res.ok(),
    ),
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  ])
  await expect(page.getByText(/Question 2 of/)).toBeVisible()

  // Resume: reload the attempt → back on Q1 with the saved answer restored.
  await page.goto(attemptUrl)
  await expect(page.getByText(/Question 1 of/)).toBeVisible()
  await expect(page.locator('input[type="radio"]').first()).toBeChecked()

  // Submit → server scores → inline result shows.
  await Promise.all([
    page.waitForResponse(
      (res) =>
        /\/api\/mock-exam-attempts\/[^/]+\/submit$/.test(res.url()) &&
        res.request().method() === 'POST' &&
        res.ok(),
    ),
    page.getByRole('button', { name: 'Submit exam' }).click(),
  ])
  // Assert the inline result card (scoped to main so it can't match the toast).
  await expect(
    page.getByRole('main').getByText('Exam submitted'),
  ).toBeVisible()
  await expect(page.getByText(/% correct/)).toBeVisible()

  // Open the dedicated review page from the result card.
  await page.getByRole('link', { name: 'Review answers' }).click()
  await expect(page).toHaveURL(
    /\/mock-exams\/[^/]+\/attempt\/[^/]+\/review$/,
  )

  // Per-section scores + the correct-answer indicator (vs user's answer) render.
  await expect(page.getByText('Section scores')).toBeVisible()
  await expect(page.getByText('Correct answer').first()).toBeVisible()
})
