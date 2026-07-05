import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { PageHeader } from '@/components/PageHeader'
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
    <main>
      <PageHeader title="Bookmarks" jpTitle="保存済み" />
      <div className="mx-auto w-full max-w-4xl px-6 py-6 sm:px-8">
        <BookmarksBrowser />
      </div>
    </main>
  )
}
