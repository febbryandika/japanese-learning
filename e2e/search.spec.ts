import { test, expect } from '@playwright/test'

// Depends on the kanji / vocabulary / grammar / video seed data. Searching a
// common English substring ("a") reliably matches curated meanings.

const searchApi = (predicate: (url: string) => boolean) => (res: {
  url(): string
  request(): { method(): string }
}) =>
  res.url().includes('/api/search?') &&
  res.request().method() === 'GET' &&
  predicate(res.url())

test('guest is redirected from /search to /login', async ({ page }) => {
  await page.goto('/search')
  await expect(page).toHaveURL(/\/login$/)
})

test('global search → grouped results → filter by type → open a result', async ({
  page,
}) => {
  // The dev server compiles each route on first hit; this multi-route flow can
  // exceed the default 30s while routes warm up.
  test.setTimeout(60_000)

  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  const email = `e2e+search+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Search User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password1234')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto('/search')
  await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible()

  // Idle prompt until there is something to search for (query is disabled).
  await expect(page.getByText(/Enter a search term/)).toBeVisible()

  // Typing a term runs a grouped search across resource types.
  await Promise.all([
    searchApiResponse(page, (url) => url.includes('q=')),
    page.getByRole('searchbox', { name: 'Search' }).fill('a'),
  ])
  // The vocabulary group section renders (a common substring of English meanings).
  await expect(page.getByRole('heading', { name: 'Vocabulary' })).toBeVisible()

  // Narrow to a single resource type via the first filter select (type).
  await page.locator('[data-slot="select-trigger"]').first().click()
  await Promise.all([
    searchApiResponse(page, (url) => url.includes('type=vocabulary')),
    page.getByRole('option', { name: 'Vocabulary' }).click(),
  ])
  // Single-type mode is paginated.
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Open a vocabulary result → its detail page (breadcrumb confirms it loaded).
  await Promise.all([
    page.waitForResponse(
      (res) =>
        /\/api\/vocabulary\/[^/?]+$/.test(res.url()) &&
        res.request().method() === 'GET',
    ),
    page.locator('a[href^="/vocabulary/"]').first().click(),
  ])
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }),
  ).toBeVisible()
})

function searchApiResponse(
  page: import('@playwright/test').Page,
  predicate: (url: string) => boolean,
) {
  return page.waitForResponse(searchApi(predicate))
}
