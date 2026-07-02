import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getServerSession } from '@/lib/auth'
import { getPublishedGroupBySlug } from '@/services/video.service'
import { GroupLessonsView } from '@/components/videos/GroupLessonsView'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupSlug: string }>
}) {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const { groupSlug } = await params
  const group = await getPublishedGroupBySlug(groupSlug)
  if (!group) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <Link
        href="/videos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All groups
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">{group.title}</h1>
      <GroupLessonsView groupId={group.id} groupSlug={group.slug} />
    </main>
  )
}
