'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bookmark,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Search,
  Settings2,
  TrendingUp,
  Video,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { NavItem } from '@/components/app-shell/nav-items'

const ICONS: Record<NonNullable<NavItem['icon']>, LucideIcon> = {
  dashboard: LayoutGrid,
  search: Search,
  videos: Video,
  exams: GraduationCap,
  reader: BookOpen,
  bookmarks: Bookmark,
  progress: TrendingUp,
  admin: Settings2,
}

// Shared nav list used in the desktop rail and the mobile drawer. Study sections
// carry a kanji glyph (漢 / 語 / 文) instead of an icon, per the Sumi Night
// design. Active state = exact match or path prefix, with aria-current.
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
        const Icon = item.icon ? ICONS[item.icon] : null
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors',
              active
                ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                : 'font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            {Icon ? (
              <Icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
            ) : (
              <span
                className="jps grid size-5 shrink-0 place-items-center text-[13px] font-semibold"
                aria-hidden
              >
                {item.glyph}
              </span>
            )}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
