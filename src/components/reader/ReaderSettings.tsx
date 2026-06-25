'use client'

import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  READER_THEMES,
  useReaderSettings,
  type ReaderTheme,
} from '@/store/useReaderSettings'

const THEME_LABELS: Record<ReaderTheme, string> = {
  white: 'White',
  sepia: 'Sepia',
  dark: 'Dark',
}

const THEME_SWATCH: Record<ReaderTheme, string> = {
  white: 'bg-white text-neutral-900',
  sepia: 'bg-[#f4ecd8] text-[#5b4636]',
  dark: 'bg-[#1a1a1a] text-neutral-100',
}

export function ReaderSettings() {
  const fontSize = useReaderSettings((s) => s.fontSize)
  const theme = useReaderSettings((s) => s.theme)
  const increaseFont = useReaderSettings((s) => s.increaseFont)
  const decreaseFont = useReaderSettings((s) => s.decreaseFont)
  const setTheme = useReaderSettings((s) => s.setTheme)

  return (
    <div className="flex flex-wrap items-center gap-6 border-b bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Font size</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Decrease font size"
          disabled={fontSize <= MIN_FONT_SIZE}
          onClick={decreaseFont}
        >
          <Minus className="size-4" aria-hidden />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums" aria-live="polite">
          {fontSize}%
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Increase font size"
          disabled={fontSize >= MAX_FONT_SIZE}
          onClick={increaseFont}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Theme</span>
        <div className="flex gap-1.5">
          {READER_THEMES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              aria-label={`${THEME_LABELS[option]} theme`}
              onClick={() => setTheme(option)}
              className={cn(
                'h-7 rounded-md border px-3 text-xs font-medium transition-colors',
                THEME_SWATCH[option],
                theme === option
                  ? 'border-ring ring-2 ring-ring/50'
                  : 'border-border',
              )}
            >
              {THEME_LABELS[option]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
