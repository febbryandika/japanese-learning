'use client'

import { useEffect, useState } from 'react'

// Debounce a rapidly-changing value (e.g. a search box) so dependent queries
// don't fire on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
