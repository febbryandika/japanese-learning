import type { ReactNode } from 'react'

// Generic, app-wide empty-results box. `message` explains the emptiness; the
// optional `action` offers a next step (e.g. a link to browse). Kept server-safe
// (no hooks) so it can render in Server Components too.
export function EmptyState({
  message,
  action,
}: {
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
