import { NextResponse, type NextRequest } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { videoListQuerySchema } from '@/lib/validations'
import { getPublishedLessonsByGroup } from '@/services/video.service'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = videoListQuerySchema.safeParse({
    groupId: request.nextUrl.searchParams.get('groupId'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }

  const lessons = await getPublishedLessonsByGroup(parsed.data.groupId, session.user.id)
  return NextResponse.json({ lessons })
}
