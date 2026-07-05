import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { KanjiBrowser } from '@/components/kanji/KanjiBrowser'

export const metadata: Metadata = {
  title: 'Kanji',
}

export default async function KanjiPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  // The browser renders its own sticky topbar (title + search), so the page is
  // just the shell for it.
  return (
    <main>
      <KanjiBrowser />
    </main>
  )
}
