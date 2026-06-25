'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Book, Rendition } from 'epubjs'
import type { NavItem } from 'epubjs/types/navigation'

import { Button } from '@/components/ui/button'
import type { ReaderTheme } from '@/store/useReaderSettings'

export type TocItem = { href: string; label: string }

export type ReaderControls = {
  next: () => void
  prev: () => void
  goTo: (href: string) => void
}

type EpubReaderProps = {
  fileUrl: string
  initialCfi: string | null
  fontSize: number
  theme: ReaderTheme
  onReady: (controls: ReaderControls, toc: TocItem[]) => void
  onRelocated: (cfi: string, percentage: number) => void
  onError: () => void
}

const THEME_STYLES: Record<ReaderTheme, { background: string; color: string }> = {
  white: { background: '#ffffff', color: '#1a1a1a' },
  sepia: { background: '#f4ecd8', color: '#5b4636' },
  dark: { background: '#1a1a1a', color: '#e5e5e5' },
}

// Renders an epub with epubjs and reports reading position back up. epubjs is
// imported lazily inside the effect so it never runs on the server. The book +
// rendition are created once; font size and theme are applied reactively without
// rebuilding (which would lose the reading position).
export function EpubReader({
  fileUrl,
  initialCfi,
  fontSize,
  theme,
  onReady,
  onRelocated,
  onError,
}: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<Rendition | null>(null)
  // Capture the restore point once at mount: later saves change the `initialCfi`
  // prop, but re-reading it would needlessly reload the book to its old spot.
  const initialCfiRef = useRef(initialCfi)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // Latest-callback refs so the heavy init effect depends only on the book
  // inputs. Updated in an effect (never during render).
  const onReadyRef = useRef(onReady)
  const onRelocatedRef = useRef(onRelocated)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onReadyRef.current = onReady
    onRelocatedRef.current = onRelocated
    onErrorRef.current = onError
  })

  useEffect(() => {
    let book: Book | null = null
    let cancelled = false
    const lastCfi = { value: initialCfiRef.current }

    function reportLocation(cfi: string) {
      lastCfi.value = cfi
      const generated = book?.locations?.length() ?? 0
      const ratio = generated
        ? book!.locations.percentageFromCfi(cfi)
        : 0
      onRelocatedRef.current(cfi, Math.round(ratio * 100))
    }

    async function init() {
      try {
        const ePub = (await import('epubjs')).default
        if (cancelled || !containerRef.current) return

        book = ePub(fileUrl)
        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'auto',
          allowScriptedContent: false,
        })
        renditionRef.current = rendition

        for (const [name, style] of Object.entries(THEME_STYLES)) {
          rendition.themes.register(name, { body: style })
        }
        rendition.themes.fontSize(`${fontSize}%`)
        rendition.themes.select(theme)

        await rendition.display(initialCfiRef.current ?? undefined)
        if (cancelled) return
        setStatus('ready')

        const nav = await book.loaded.navigation
        if (cancelled) return
        onReadyRef.current(
          {
            next: () => void rendition.next(),
            prev: () => void rendition.prev(),
            goTo: (href) => void rendition.display(href),
          },
          flattenToc(nav.toc),
        )

        rendition.on('relocated', (location: { start: { cfi: string } }) => {
          reportLocation(location.start.cfi)
        })
        rendition.on('keyup', (event: KeyboardEvent) => handleKey(event, rendition))

        // Generate locations in the background so the progress % is accurate;
        // refresh the current position once they're ready.
        book.ready
          .then(() => book!.locations.generate(1600))
          .then(() => {
            if (!cancelled && lastCfi.value) reportLocation(lastCfi.value)
          })
          .catch(() => {})
      } catch {
        if (cancelled) return
        setStatus('error')
        onErrorRef.current()
      }
    }

    void init()

    return () => {
      cancelled = true
      renditionRef.current = null
      book?.destroy()
    }
    // Recreate only when the book file changes (the restore point is captured
    // once via initialCfiRef; settings are applied by the effects below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl])

  // Apply settings reactively to the live rendition (no rebuild).
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`)
  }, [fontSize])

  useEffect(() => {
    renditionRef.current?.themes.select(theme)
  }, [theme])

  // Arrow keys when focus is on the page chrome (the iframe handles its own).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const rendition = renditionRef.current
      if (rendition) handleKey(event, rendition)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      className="relative h-full w-full"
      style={{ background: THEME_STYLES[theme].background }}
    >
      <div ref={containerRef} className="h-full w-full" />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          <span className="sr-only">Loading book…</span>
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <p className="text-sm text-destructive">
            This book could not be opened.
          </p>
          <Button variant="outline" size="sm" onClick={() => location.reload()}>
            Reload
          </Button>
        </div>
      )}
    </div>
  )
}

function handleKey(event: KeyboardEvent, rendition: Rendition) {
  if (event.key === 'ArrowLeft') void rendition.prev()
  if (event.key === 'ArrowRight') void rendition.next()
}

// Flatten the table of contents to one level of options, indenting sub-chapters
// so the chapter <Select> stays a flat list.
function flattenToc(items: NavItem[], depth = 0): TocItem[] {
  const result: TocItem[] = []
  for (const item of items) {
    result.push({
      href: item.href,
      label: `${'— '.repeat(depth)}${item.label.trim()}`,
    })
    if (item.subitems?.length) {
      result.push(...flattenToc(item.subitems, depth + 1))
    }
  }
  return result
}
