'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'

import { useUIStore } from '@/store/useUIStore'
import { AppSidebar } from '@/components/app-shell/AppSidebar'
import { ThemeToggle } from '@/components/app-shell/ThemeToggle'
import { LogoutButton } from '@/components/LogoutButton'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/app-shell/nav-items'

export type ShellUser = {
  name: string
  role: 'admin' | 'learner'
}

// Wordmark at the top of the rail: vermillion seal + JLPT N2 / STUDY.
function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-1.5">
      <span className="seal size-10 rounded-[11px] text-[21px] font-semibold" aria-hidden>
        学
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-bold tracking-tight">JLPT N2</span>
        <span className="mt-1 block text-[9.5px] font-medium tracking-[0.14em] text-muted-foreground">
          STUDY
        </span>
      </span>
    </Link>
  )
}

// Bottom-of-rail user chip: avatar initial + name + role, with theme toggle
// and sign-out alongside.
function UserChip({ user }: { user: ShellUser }) {
  return (
    <div className="flex items-center gap-2 px-1.5">
      <span
        className="grid size-[34px] shrink-0 place-items-center rounded-full bg-sidebar-accent text-[13px] font-semibold text-primary"
        aria-hidden
      >
        {user.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[12.5px] font-semibold">{user.name}</span>
        <span className="block text-[11px] text-muted-foreground capitalize">
          {user.role}
        </span>
      </span>
      <ThemeToggle />
      <LogoutButton />
    </div>
  )
}

// App frame for the learner area: a persistent sidebar rail on desktop and a
// slide-in drawer on mobile (open state in useUIStore). Pages render their own
// <main> inside the content region, so this only owns the chrome.
export function AppShell({
  items,
  user,
  children,
}: {
  items: NavItem[]
  user: ShellUser
  children: ReactNode
}) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebar = useUIStore((state) => state.setSidebar)

  return (
    <div className="flex min-h-full">
      {/* Desktop rail */}
      <aside className="hidden w-[236px] shrink-0 border-r bg-sidebar md:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-5 px-4 py-5">
          <Brand />
          <AppSidebar items={items} className="flex-1 overflow-y-auto" />
          <UserChip user={user} />
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b bg-sidebar p-3 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebar(true)}
          >
            <Menu className="size-4" aria-hidden />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <span className="seal size-7 rounded-[9px] text-sm font-semibold" aria-hidden>
              学
            </span>
            JLPT N2
          </Link>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile drawer — base UI handles focus, Escape, backdrop, and aria-modal */}
      <DialogPrimitive.Root open={sidebarOpen} onOpenChange={setSidebar}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 md:hidden" />
          <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col gap-5 border-r bg-sidebar px-4 py-5 shadow-lg outline-none duration-100 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left md:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <Brand />
            <AppSidebar
              items={items}
              className="flex-1 overflow-y-auto"
              onNavigate={() => setSidebar(false)}
            />
            <UserChip user={user} />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
