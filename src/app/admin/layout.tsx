import type { ReactNode } from 'react'
import Link from 'next/link'

import { requireAdminPage } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // Primary gate for the whole /admin/* segment. Each page also guards itself
  // (the layout guard does not block a page's own data fetch from running).
  await requireAdminPage()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to app
        </Link>
        <h2 className="mt-4 mb-3 text-lg font-semibold">Admin</h2>
        <AdminSidebar />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
