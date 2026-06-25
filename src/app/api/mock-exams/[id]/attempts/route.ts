import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import { createOrResumeAttempt } from '@/services/exam.service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const result = await createOrResumeAttempt(session.user.id, id)
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(result, { status: result.resumed ? 200 : 201 })
}
