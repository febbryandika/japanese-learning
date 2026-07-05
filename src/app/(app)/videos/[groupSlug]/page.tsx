import { notFound, redirect } from 'next/navigation'

import { getServerSession } from '@/lib/auth'
import { getPublishedGroupBySlug } from '@/services/video.service'
import { Breadcrumbs } from '@/components/Breadcrumbs'
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
    <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-6 sm:px-8">
      <Breadcrumbs
        items={[{ label: 'Videos', href: '/videos' }, { label: group.title }]}
      />
      <h1 className="jp text-2xl font-bold tracking-tight" lang="ja">
        {group.title}
      </h1>
      <GroupLessonsView groupId={group.id} groupSlug={group.slug} />
    </main>
  )
}
