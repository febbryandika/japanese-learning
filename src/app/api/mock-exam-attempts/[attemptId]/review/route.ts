import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import {
  AttemptNotSubmittedError,
  getAttemptReview,
} from '@/services/exam.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { attemptId } = await params
  try {
    const review = await getAttemptReview(session.user.id, attemptId)
    if (!review) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(review)
  } catch (error) {
    if (error instanceof AttemptNotSubmittedError) {
      return NextResponse.json(
        { error: 'Attempt not submitted' },
        { status: 409 },
      )
    }
    throw error
  }
}
