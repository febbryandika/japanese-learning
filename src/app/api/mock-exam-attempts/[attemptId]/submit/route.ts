import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import {
  ExamAlreadySubmittedError,
  submitAttempt,
} from '@/services/exam.service'
import { submitExamSchema } from '@/lib/validations'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = submitExamSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
  }

  const { attemptId } = await params
  try {
    const result = await submitAttempt(
      session.user.id,
      attemptId,
      parsed.data.answers,
    )
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ExamAlreadySubmittedError) {
      // A duplicate submit still returns the stored score so the client can
      // navigate straight to the result.
      return NextResponse.json(
        { error: 'Attempt already submitted', ...error.result },
        { status: 409 },
      )
    }
    throw error
  }
}
