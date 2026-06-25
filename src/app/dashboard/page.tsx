import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { LogoutButton } from '@/components/LogoutButton'
import { DashboardView } from '@/components/dashboard/DashboardView'

const NAV_LINKS = [
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
        {NAV_LINKS.map((link) => (
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
