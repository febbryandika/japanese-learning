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
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </header>

      <DashboardView />
    </main>
  )
}
