import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { SearchView } from '@/components/search/SearchView'

export const metadata: Metadata = {
  title: 'Search',
}

export default async function SearchPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Search</h1>
      <SearchView />
    </main>
  )
}
