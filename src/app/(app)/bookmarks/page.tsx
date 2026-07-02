import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { BookmarksBrowser } from '@/components/bookmarks/BookmarksBrowser'

export const metadata: Metadata = {
  title: 'Bookmarks',
}

export default async function BookmarksPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Bookmarks</h1>
      <BookmarksBrowser />
    </main>
  )
}
