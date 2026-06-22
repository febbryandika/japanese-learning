import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { getPublishedLessonGroups } from '@/services/video.service'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const groups = await getPublishedLessonGroups()
  return NextResponse.json({ groups })
}
