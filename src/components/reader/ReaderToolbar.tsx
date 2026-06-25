'use client'

import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'

export function ReaderToolbar({
  title,
  author,
  settingsOpen,
  onToggleSettings,
}: {
  title: string
  author: string | null
  settingsOpen: boolean
  onToggleSettings: () => void
}) {
  return (
    <header className="flex items-center gap-3 border-b bg-background px-4 py-2">
      <Link
        href="/reader"
        aria-label="Back to library"
        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
      >
        <ArrowLeft className="size-4" aria-hidden />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {author && (
          <p className="truncate text-xs text-muted-foreground">{author}</p>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        aria-pressed={settingsOpen}
        aria-label="Reader settings"
        onClick={onToggleSettings}
      >
        <Settings className="size-4" aria-hidden />
      </Button>
    </header>
  )
}
