'use client'

import { Bookmark } from 'lucide-react'

import { Button } from '@/components/ui/button'

// Shared "bookmarked only" filter toggle. A pressed-state button (aria-pressed)
// rather than a checkbox, matching the compact filter row on list/search pages.
export function BookmarkedToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: (active: boolean) => void
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-pressed={active}
      onClick={() => onToggle(!active)}
    >
      <Bookmark className="size-4" aria-hidden />
      Bookmarked
    </Button>
  )
}
