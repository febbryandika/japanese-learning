'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'

import { useUIStore } from '@/store/useUIStore'
import { AppSidebar } from '@/components/app-shell/AppSidebar'
import { LogoutButton } from '@/components/LogoutButton'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/components/app-shell/nav-items'

// App frame for the learner area: a persistent sidebar on desktop and a slide-in
// drawer on mobile (open state in useUIStore). Pages render their own <main>
// inside the content region, so this only owns the chrome.
export function AppShell({
  items,
  children,
}: {
  items: NavItem[]
  children: ReactNode
}) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebar = useUIStore((state) => state.setSidebar)

  return (
    <div className="flex min-h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-muted/20 md:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 p-4">
          <Link href="/dashboard" className="px-2 text-lg font-semibold">
            JLPT N2
          </Link>
          <AppSidebar items={items} className="flex-1 overflow-y-auto" />
          <LogoutButton />
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b p-3 md:hidden">
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
          <Link href="/dashboard" className="font-semibold">
            JLPT N2
          </Link>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile drawer — base UI handles focus, Escape, backdrop, and aria-modal */}
      <DialogPrimitive.Root open={sidebarOpen} onOpenChange={setSidebar}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 md:hidden" />
          <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col gap-6 border-r bg-background p-4 shadow-lg outline-none duration-100 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left md:hidden">
            <DialogPrimitive.Title className="px-2 text-lg font-semibold">
              JLPT N2
            </DialogPrimitive.Title>
            <AppSidebar
              items={items}
              className="flex-1 overflow-y-auto"
              onNavigate={() => setSidebar(false)}
            />
            <LogoutButton />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
