'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import type { NavItem } from '@/components/app-shell/nav-items'

// Shared nav list used in the desktop sidebar and the mobile drawer. Active state
// mirrors the AdminSidebar (exact match or path prefix) with aria-current.
export function AppSidebar({
  items,
  className,
  onNavigate,
}: {
  items: NavItem[]
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className={cn('flex flex-col gap-1', className)}
    >
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'rounded-md px-2.5 py-2 text-sm transition-colors',
              active
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
