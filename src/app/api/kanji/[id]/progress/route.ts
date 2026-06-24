import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { updateStudyProgressSchema } from '@/lib/validations'
import { updateStudyProgress } from '@/services/progress.service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateStudyProgressSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid progress state' }, { status: 400 })
  }

  const { id } = await params
  const result = await updateStudyProgress(
    session.user.id,
    'kanji',
    id,
    parsed.data.progressState,
  )
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
