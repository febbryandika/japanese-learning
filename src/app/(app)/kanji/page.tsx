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

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Kanji</h1>
      <KanjiBrowser />
    </main>
  )
}
