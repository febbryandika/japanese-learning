import { test, expect } from '@playwright/test'

// Depends on `pnpm db:seed:vocabulary` having run: vocabulary_items must hold the
// 3,434 N2 words across 10 parts of speech.

const vocabList = (predicate: (url: string) => boolean) => (res: {
  url(): string
  request(): { method(): string }
}) =>
  res.url().includes('/api/vocabulary?') &&
  res.request().method() === 'GET' &&
  predicate(res.url())

test('guest is redirected from /vocabulary to /login', async ({ page }) => {
  await page.goto('/vocabulary')
  await expect(page).toHaveURL(/\/login$/)
})

test('browse vocabulary → paginate → search → filter by part of speech → open detail', async ({
  page,
}) => {
  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  const email = `e2e+vocab+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Vocab User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password1234')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // List page loads with a paginated grid of vocabulary.
  await page.goto('/vocabulary')
  await expect(page.getByRole('heading', { name: 'Vocabulary' })).toBeVisible()
  await expect(page.locator('a[href^="/vocabulary/"]').first()).toBeVisible()
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Pagination: Next advances to page 2 (3,434 words ÷ 24 per page → many pages).
  await Promise.all([
    page.waitForResponse(vocabList((url) => url.includes('page=2'))),
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  ])
  await expect(page.getByText(/Page 2 of/)).toBeVisible()

  // Search resets to page 1 and re-queries with the term (matches English meanings).
  await Promise.all([
    page.waitForResponse(vocabList((url) => url.includes('q='))),
    page.getByRole('searchbox', { name: 'Search vocabulary' }).fill('a'),
  ])
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Clear the search to restore the full list.
  await Promise.all([
    page.waitForResponse(vocabList((url) => !url.includes('q='))),
    page.getByRole('searchbox', { name: 'Search vocabulary' }).fill(''),
  ])

  // Part-of-speech filter: pick the first real value (Noun) from the dropdown.
  await page.locator('[data-slot="select-trigger"]').click()
  await Promise.all([
    page.waitForResponse(vocabList((url) => url.includes('partOfSpeech='))),
    page.getByRole('option').nth(1).click(),
  ])
  await expect(page.locator('a[href^="/vocabulary/"]').first()).toBeVisible()

  // Open a vocabulary detail page → example-sentence section + back link.
  await Promise.all([
    page.waitForResponse(
      (res) =>
        /\/api\/vocabulary\/[^/?]+$/.test(res.url()) &&
        res.request().method() === 'GET',
    ),
    page.locator('a[href^="/vocabulary/"]').first().click(),
  ])
  await expect(
    page.getByRole('heading', { name: 'Example sentence' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'All vocabulary' })).toBeVisible()
})
