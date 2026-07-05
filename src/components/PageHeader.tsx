import type { ReactNode } from 'react'

// Sticky page topbar (Sumi Night): bold title with a muted Japanese subtitle,
// optional right-aligned content (e.g. a search box), blurred app background.
// Presentational only, so both server pages and client views can render it.
export function PageHeader({
  title,
  jpTitle,
  children,
}: {
  title: string
  jpTitle?: string
  children?: ReactNode
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b bg-background/80 px-6 py-4 backdrop-blur-md sm:px-8">
      <h1 className="text-xl font-bold tracking-tight">
        {title}
        {jpTitle ? (
          <span className="jp ml-2 text-[15px] font-normal text-muted-foreground" lang="ja">
            {jpTitle}
          </span>
        ) : null}
      </h1>
      {children ? <div className="ml-auto flex items-center gap-3">{children}</div> : null}
    </div>
  )
}
