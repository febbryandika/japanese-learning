'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ErrorState'
import {
  EpubReader,
  type ReaderControls,
  type TocItem,
} from '@/components/reader/EpubReader'
import { ReaderToolbar } from '@/components/reader/ReaderToolbar'
import { ReaderSettings } from '@/components/reader/ReaderSettings'
import { ReaderNavigation } from '@/components/reader/ReaderNavigation'
import {
  useBook,
  useReaderProgress,
  useSaveReaderProgress,
} from '@/hooks/use-reader'
import { useReaderSettings } from '@/store/useReaderSettings'

const SAVE_DEBOUNCE_MS = 800

export function ReaderView({ bookId }: { bookId: string }) {
  const book = useBook(bookId)
  // Restore point, read from the book-detail cache (populated by useBook).
  const savedCfi = useReaderProgress(bookId)
  const saveProgress = useSaveReaderProgress()
  const fontSize = useReaderSettings((s) => s.fontSize)
  const theme = useReaderSettings((s) => s.theme)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [toc, setToc] = useState<TocItem[]>([])
  const [percentage, setPercentage] = useState(0)

  const controlsRef = useRef<ReaderControls | null>(null)
  const pendingCfi = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // mutate is a stable reference in react-query v5.
  const saveMutate = saveProgress.mutate

  const flushSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const cfi = pendingCfi.current
    if (!cfi) return
    pendingCfi.current = null
    saveMutate(
      { bookId, cfi },
      { onError: () => toast.error('Couldn’t save your reading position.') },
    )
  }, [bookId, saveMutate])

  // Debounce saves: page/chapter turns fire `relocated` rapidly; persist the
  // latest CFI once things settle.
  const handleRelocated = useCallback(
    (cfi: string, pct: number) => {
      setPercentage(pct)
      pendingCfi.current = cfi
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS)
    },
    [flushSave],
  )

  const handleReady = useCallback(
    (controls: ReaderControls, tocItems: TocItem[]) => {
      controlsRef.current = controls
      setToc(tocItems)
      setReady(true)
    },
    [],
  )

  // Persist the latest position when leaving the reader or hiding the tab.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden') flushSave()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      flushSave()
    }
  }, [flushSave])

  // Wait for the book detail (which carries the saved CFI) before mounting the
  // reader so the initial restore point is correct.
  if (book.isPending) {
    return <ReaderSkeleton />
  }

  if (book.isError || !book.data) {
    return (
      <div className="mx-auto w-full max-w-md p-6">
        <ErrorState message="Couldn’t load this book." onRetry={book.refetch} />
      </div>
    )
  }

  const initialCfi = savedCfi

  return (
    <div className="flex h-[100dvh] flex-col">
      <ReaderToolbar
        title={book.data.title}
        author={book.data.author}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
      />

      {settingsOpen && <ReaderSettings />}

      <div className="min-h-0 flex-1">
        <EpubReader
          key={book.data.fileUrl}
          fileUrl={book.data.fileUrl}
          initialCfi={initialCfi}
          fontSize={fontSize}
          theme={theme}
          onReady={handleReady}
          onRelocated={handleRelocated}
          onError={() => toast.error('This book could not be opened.')}
        />
      </div>

      <ReaderNavigation
        toc={toc}
        percentage={percentage}
        disabled={!ready}
        onPrev={() => controlsRef.current?.prev()}
        onNext={() => controlsRef.current?.next()}
        onSelectChapter={(href) => controlsRef.current?.goTo(href)}
      />
    </div>
  )
}

function ReaderSkeleton() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="min-h-0 flex-1 p-6">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    </div>
  )
}
