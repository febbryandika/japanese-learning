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

  // The browser renders its own sticky topbar (title + search), so the page is
  // just the shell for it.
  return (
    <main>
      <GrammarBrowser />
    </main>
  )
}
