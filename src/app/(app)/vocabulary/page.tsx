import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { VocabularyBrowser } from '@/components/vocabulary/VocabularyBrowser'

export const metadata: Metadata = {
  title: 'Vocabulary',
}

export default async function VocabularyPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  // The browser renders its own sticky topbar (title + search), so the page is
  // just the shell for it.
  return (
    <main>
      <VocabularyBrowser />
    </main>
  )
}
