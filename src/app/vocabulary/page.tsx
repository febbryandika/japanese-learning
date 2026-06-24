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

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Vocabulary</h1>
      <VocabularyBrowser />
    </main>
  )
}
