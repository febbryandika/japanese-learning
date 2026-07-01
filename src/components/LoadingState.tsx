import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Generic card-grid loading placeholder used by the list/search views so their
// skeletons stay consistent. `count` controls how many cards render; the grid
// matches the result grids (1 / 2 / 3 columns).
export function LoadingState({
  count = 6,
  itemClassName,
  className,
}: {
  count?: number
  itemClassName?: string
  className?: string
}) {
  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      aria-busy
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-28 w-full rounded-xl', itemClassName)}
        />
      ))}
    </div>
  )
}
