import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { GrammarBrowser } from '@/components/grammar/GrammarBrowser'

export const metadata: Metadata = {
  title: 'Grammar',
}

export default async function GrammarPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Grammar</h1>
      <GrammarBrowser />
    </main>
  )
}
