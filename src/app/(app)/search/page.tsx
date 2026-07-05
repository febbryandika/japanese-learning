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

  // SearchView renders its own sticky topbar (title + JP subtitle).
  return (
    <main>
      <SearchView />
    </main>
  )
}
