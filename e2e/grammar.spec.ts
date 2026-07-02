import { test, expect } from '@playwright/test'

// Depends on `pnpm db:seed:grammar` having run: grammar_items must hold the 135
// N2 patterns and grammar_examples the 639 curated sentences.

const grammarList = (predicate: (url: string) => boolean) => (res: {
  url(): string
  request(): { method(): string }
}) =>
  res.url().includes('/api/grammar?') &&
  res.request().method() === 'GET' &&
  predicate(res.url())

test('guest is redirected from /grammar to /login', async ({ page }) => {
  await page.goto('/grammar')
  await expect(page).toHaveURL(/\/login$/)
})

test('browse grammar → paginate → search → filter by JLPT → open detail', async ({
  page,
}) => {
  // The dev server compiles each route on first hit; this multi-route flow can
  // exceed the default 30s while routes warm up.
  test.setTimeout(60_000)

  // Register a fresh user — Better Auth auto-signs-in, landing on the dashboard.
  const email = `e2e+grammar+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel('Name').fill('E2E Grammar User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password1234')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  // List page loads with a paginated grid of grammar.
  await page.goto('/grammar')
  await expect(page.getByRole('heading', { name: 'Grammar' })).toBeVisible()
  await expect(page.locator('a[href^="/grammar/"]').first()).toBeVisible()
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Pagination: Next advances to page 2 (135 patterns ÷ 24 per page → many pages).
  await Promise.all([
    page.waitForResponse(grammarList((url) => url.includes('page=2'))),
    page.getByRole('button', { name: 'Next', exact: true }).click(),
  ])
  await expect(page.getByText(/Page 2 of/)).toBeVisible()

  // Search resets to page 1 and re-queries with the term (matches the pattern).
  await Promise.all([
    page.waitForResponse(grammarList((url) => url.includes('q='))),
    page.getByRole('searchbox', { name: 'Search grammar' }).fill('もの'),
  ])
  await expect(page.getByText(/Page 1 of/)).toBeVisible()

  // Clear the search to restore the full list. With the tuned staleTime the
  // original unfiltered page is served from cache (no network response). Wait for
  // the debounced clear to settle in the URL before filtering, so the filter's
  // navigation can't race (and clobber) the search-clear navigation.
  await page.getByRole('searchbox', { name: 'Search grammar' }).fill('')
  await expect(page).not.toHaveURL(/q=/)
  await expect(page.locator('a[href^="/grammar/"]').first()).toBeVisible()

  // JLPT filter is the first of the filter selects (JLPT / mastery).
  await page.locator('[data-slot="select-trigger"]').first().click()
  await Promise.all([
    page.waitForResponse(grammarList((url) => url.includes('jlptLevel='))),
    page.getByRole('option').nth(1).click(),
  ])
  await expect(page.locator('a[href^="/grammar/"]').first()).toBeVisible()

  // Open a grammar detail page → example-sentences section + back link.
  await Promise.all([
    page.waitForResponse(
      (res) =>
        /\/api\/grammar\/[^/?]+$/.test(res.url()) &&
        res.request().method() === 'GET',
    ),
    page.locator('a[href^="/grammar/"]').first().click(),
  ])
  await expect(
    // `exact` so it doesn't also match the "AI example sentences" heading.
    page.getByRole('heading', { name: 'Example sentences', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }),
  ).toBeVisible()
})
