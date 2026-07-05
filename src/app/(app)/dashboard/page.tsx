import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { DashboardView } from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  // The (app) layout also guards; this fetch gives us the user's name to greet.
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-6 py-8 sm:px-8">
      <header>
        <p className="jp text-sm font-medium text-primary" lang="ja">
          おかえりなさい
        </p>
        <h1 className="mt-1.5 text-[32px] leading-tight font-bold tracking-tight">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          Pick up where you left off, or start something new.
        </p>
      </header>

      <DashboardView />
    </main>
  )
}
