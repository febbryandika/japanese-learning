import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { updateVideoProgressSchema } from '@/lib/validations'
import { updateVideoProgress } from '@/services/video.service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateVideoProgressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid progress state' }, { status: 400 })
  }

  const { id } = await params
  const result = await updateVideoProgress(
    session.user.id,
    id,
    parsed.data.progressState,
  )
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
