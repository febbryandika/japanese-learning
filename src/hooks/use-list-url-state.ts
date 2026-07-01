'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useDebouncedValue } from '@/hooks/use-debounced-value'

// Backs a list page's filters with the URL so state survives refresh, is
// shareable, and works with browser back/forward.
//
// - The search box keeps a local draft (immediate typing) and commits its
//   debounced value to `?q=` via router.replace (no per-keystroke history spam).
// - Filter selects and the page number write via router.push, so back/forward
//   walks through those changes.
// - Changing the search or any filter resets the page (drops `?page=`).
// - External URL changes (back/forward, shared links) reflect back into the
//   draft input via a ref-guarded effect, avoiding update loops.
export function useListUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const commit = useCallback(
    (
      updates: Record<string, string | undefined>,
      history: 'push' | 'replace',
    ) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === '') params.delete(key)
        else params.set(key, value)
      }
      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      if (history === 'replace') router.replace(url, { scroll: false })
      else router.push(url, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const committedQ = searchParams.get('q') ?? ''
  const [searchInput, setSearchInput] = useState(committedQ)
  const debounced = useDebouncedValue(searchInput.trim(), 300)
  const lastCommitted = useRef(committedQ)

  // Draft → URL (debounced). Resets the page.
  useEffect(() => {
    if (debounced === lastCommitted.current) return
    lastCommitted.current = debounced
    commit({ q: debounced || undefined, page: undefined }, 'replace')
  }, [debounced, commit])

  // URL → draft, only when it changed from outside (back/forward, links).
  useEffect(() => {
    if (committedQ !== lastCommitted.current) {
      lastCommitted.current = committedQ
      setSearchInput(committedQ)
    }
  }, [committedQ])

  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const setPage = useCallback(
    (next: number) => commit({ page: next > 1 ? String(next) : undefined }, 'push'),
    [commit],
  )

  const getParam = useCallback(
    (key: string) => searchParams.get(key) ?? undefined,
    [searchParams],
  )

  const setParam = useCallback(
    (key: string, value: string | undefined) =>
      commit({ [key]: value, page: undefined }, 'push'),
    [commit],
  )

  return {
    // Committed search term (drives the query); draft input value + setter.
    q: committedQ,
    searchInput,
    setSearchInput,
    page,
    setPage,
    getParam,
    setParam,
  }
}
