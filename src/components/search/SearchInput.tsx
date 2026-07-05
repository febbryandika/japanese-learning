'use client'

import { Search } from 'lucide-react'

// Large hero search field (Sumi Night): rounded surface card with an inline
// icon, unstyled input inside.
export function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card px-4.5 py-3.5 transition-colors focus-within:border-primary">
      <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search kanji, vocabulary, grammar, and videos…"
        aria-label="Search"
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
