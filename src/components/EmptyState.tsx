import type { ReactNode } from 'react'

// Generic, app-wide empty-results box. `message` explains the emptiness; the
// optional `glyph` renders a large muted Japanese character above it (Sumi
// Night style) and `action` offers a next step. Kept server-safe (no hooks) so
// it can render in Server Components too.
export function EmptyState({
  message,
  glyph,
  action,
}: {
  message: string
  glyph?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 p-10 text-center">
      {glyph ? (
        <span className="jp text-4xl text-muted-foreground" lang="ja" aria-hidden>
          {glyph}
        </span>
      ) : null}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
