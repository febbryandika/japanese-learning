import { test, expect } from '@playwright/test'

// Depends on `pnpm db:seed:kanji` having run: kanji_items must hold the 390 N2
// kanji (and stroke counts from `pnpm exec tsx scripts/build-kanji-strokes.ts`
// for the stroke-filter step).

const kanjiList = (predicate: (url: string) => boolean) => (res: {
  url(): string
  request(): { method(): string }
}) =>
  res.url().includes('/api/kanji?') &&
  res.request().method() === 'GET' &&
  predicate(res.url())

test('browse kanji → paginate → search → filter by strokes → open detail', async ({
  page,
}) => {
  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  const email = `e2e+kanji+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Kanji User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password1234')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // List page loads with a paginated grid of kanji.
  await page.goto('/kanji')
  await expect(page.getByRole('heading', { name: 'Kanji' })).toBeVisible()
  await expect(page.locator('a[href^="/kanji/"]').first()).toBeVisible()
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Pagination: Next advances to page 2 (390 kanji ÷ 24 per page → many pages).
  await Promise.all([
    page.waitForResponse(kanjiList((url) => url.includes('page=2'))),
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  ])
  await expect(page.getByText(/Page 2 of/)).toBeVisible()

  // Search resets to page 1 and re-queries with the term.
  await Promise.all([
    page.waitForResponse(kanjiList((url) => url.includes('q='))),
    page.getByRole('searchbox', { name: 'Search kanji' }).fill('a'),
  ])
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Clear the search to restore the full list.
  await Promise.all([
    page.waitForResponse(kanjiList((url) => !url.includes('q='))),
    page.getByRole('searchbox', { name: 'Search kanji' }).fill(''),
  ])

  // Stroke-count filter: pick the first real stroke value from the dropdown.
  await page.locator('[data-slot="select-trigger"]').click()
  await Promise.all([
    page.waitForResponse(kanjiList((url) => url.includes('strokeCount='))),
    page.getByRole('option').nth(1).click(),
  ])
  await expect(page.locator('a[href^="/kanji/"]').first()).toBeVisible()

  // Open a kanji detail page → readings + compound vocabulary section.
  await Promise.all([
    page.waitForResponse(
      (res) =>
        /\/api\/kanji\/[^/?]+$/.test(res.url()) &&
        res.request().method() === 'GET',
    ),
    page.locator('a[href^="/kanji/"]').first().click(),
  ])
  await expect(
    page.getByRole('heading', { name: 'Compound vocabulary' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'All kanji' })).toBeVisible()
})
