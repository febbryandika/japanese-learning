import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getServerSession, getUserRole } from '@/lib/auth'
import { LogoutButton } from '@/components/LogoutButton'
import { DashboardView } from '@/components/dashboard/DashboardView'

const NAV_LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/videos', label: 'Videos' },
  { href: '/kanji', label: 'Kanji' },
  { href: '/vocabulary', label: 'Vocabulary' },
  { href: '/grammar', label: 'Grammar' },
  { href: '/mock-exams', label: 'Mock Exams' },
  { href: '/reader', label: 'Reader' },
  { href: '/bookmarks', label: 'Bookmarks' },
  { href: '/progress', label: 'Progress' },
]

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  // Admins get an extra nav entry into the content-management area. The role is
  // resolved server-side so a learner never sees (or flashes) the link.
  const role = await getUserRole(session.user.id)
  const navLinks =
    role === 'admin'
      ? [...NAV_LINKS, { href: '/admin', label: 'Admin' }]
      : NAV_LINKS

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {session.user.name}
          </p>
        </div>
        <LogoutButton />
      </header>

      <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <DashboardView />
    </main>
  )
}
