'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TocItem } from '@/components/reader/EpubReader'

export function ReaderNavigation({
  toc,
  percentage,
  disabled,
  onPrev,
  onNext,
  onSelectChapter,
}: {
  toc: TocItem[]
  percentage: number
  disabled: boolean
  onPrev: () => void
  onNext: () => void
  onSelectChapter: (href: string) => void
}) {
  const items = Object.fromEntries(toc.map((item) => [item.href, item.label]))

  return (
    <nav
      className="flex items-center gap-3 border-t bg-background px-4 py-2"
      aria-label="Reader navigation"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={disabled}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Prev
      </Button>

      {toc.length > 0 && (
        <Select
          items={items}
          onValueChange={(value) => value && onSelectChapter(String(value))}
          disabled={disabled}
        >
          <SelectTrigger className="min-w-0 flex-1" aria-label="Jump to chapter">
            <SelectValue placeholder="Chapters" />
          </SelectTrigger>
          <SelectContent>
            {toc.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <span
        className="ml-auto text-sm text-muted-foreground tabular-nums"
        aria-live="polite"
      >
        {percentage}%
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next page"
      >
        Next
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </nav>
  )
}
