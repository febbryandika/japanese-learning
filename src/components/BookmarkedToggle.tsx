'use client'

import { Bookmark } from 'lucide-react'

import { cn } from '@/lib/utils'

// Shared "bookmarked only" filter toggle, styled as a Sumi Night chip to sit
// alongside the mastery filter chips (aria-pressed carries the state).
export function BookmarkedToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: (active: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onToggle(!active)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] leading-none font-medium transition-colors',
        active
          ? 'border-transparent bg-primary font-semibold text-primary-foreground'
          : 'bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <Bookmark className={cn('size-3.5', active && 'fill-current')} aria-hidden />
      Bookmarked
    </button>
  )
}
