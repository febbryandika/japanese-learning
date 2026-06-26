'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { ADMIN_SECTIONS } from '@/components/admin/sections'

function SidebarLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-md px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
    >
      {label}
    </Link>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      <SidebarLink href="/admin" label="Overview" active={pathname === '/admin'} />
      {ADMIN_SECTIONS.map((section) => (
        <SidebarLink
          key={section.href}
          href={section.href}
          label={section.label}
          active={
            pathname === section.href ||
            pathname.startsWith(`${section.href}/`)
          }
        />
      ))}
    </nav>
  )
}
