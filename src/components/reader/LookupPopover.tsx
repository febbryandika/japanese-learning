'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'
import { useLookup } from '@/hooks/use-lookup'

type LookupPopoverProps = {
  query: string
  // Viewport coordinates of the selection's bottom-center; the popover anchors here.
  x: number
  y: number
  onClose: () => void
}

// Word/kanji lookup popover shown when text is selected in the reader. It anchors
// to an invisible fixed-positioned trigger placed at the selection point; Base UI
// handles outside-click / Escape dismissal (→ onClose) and focus management.
export function LookupPopover({ query, x, y, onClose }: LookupPopoverProps) {
  // Coalesce rapid re-selections before hitting the API (cache covers repeats).
  const debounced = useDebouncedValue(query, 200)
  const { data, isPending, isError, refetch } = useLookup(debounced)

  const vocabulary = data?.vocabulary ?? []
  const kanji = data?.kanji ?? []
  const hasResults = vocabulary.length > 0 || kanji.length > 0

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <PopoverTrigger
        aria-hidden
        tabIndex={-1}
        style={{
          position: 'fixed',
          left: x,
          top: y,
          width: 0,
          height: 0,
          padding: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <PopoverContent
        side="bottom"
        sideOffset={8}
        className="max-h-[60vh] w-80 max-w-[90vw] overflow-y-auto"
        aria-label={`Lookup results for ${query}`}
      >
        {isPending ? (
          <LookupSkeleton />
        ) : isError ? (
          <ErrorState message="Lookup failed." onRetry={() => void refetch()} />
        ) : !hasResults ? (
          <p className="py-1 text-sm text-muted-foreground">No matches found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <LookupSection title="Vocabulary">
              {vocabulary.length ? (
                vocabulary.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vocabulary/${v.id}`}
                    onClick={onClose}
                    className="block rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-base font-medium">{v.word}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.reading}
                      </span>
                      {v.partOfSpeech && (
                        <Badge variant="secondary" className="ml-auto">
                          {v.partOfSpeech}
                        </Badge>
                      )}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {v.meaning}
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyLine>No vocabulary.</EmptyLine>
              )}
            </LookupSection>

            <LookupSection title="Kanji">
              {kanji.length ? (
                kanji.map((k) => (
                  <Link
                    key={k.id}
                    href={`/kanji/${k.id}`}
                    onClick={onClose}
                    className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <span className="text-2xl leading-none">{k.character}</span>
                    <span className="min-w-0">
                      <span className="block text-sm">{k.meaning}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[k.onyomi, k.kunyomi].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyLine>No kanji.</EmptyLine>
              )}
            </LookupSection>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function LookupSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-2 text-xs text-muted-foreground">{children}</p>
}

function LookupSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

// Debounce so rapid re-selections don't each fire a request.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
