import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { getServerSession, getUserRole } from '@/lib/auth'
import { AppShell } from '@/components/app-shell/AppShell'
import { ADMIN_NAV_ITEM, NAV_ITEMS } from '@/components/app-shell/nav-items'

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Primary gate for the whole learner area. Pages also guard themselves (the
  // layout guard does not block a page's own data fetch), matching the admin
  // layout convention.
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  // Admins get an extra nav entry into the content-management area; resolved
  // server-side so a learner never sees (or flashes) the link.
  const role = await getUserRole(session.user.id)
  const items =
    role === 'admin' ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS

  return <AppShell items={items}>{children}</AppShell>
}
