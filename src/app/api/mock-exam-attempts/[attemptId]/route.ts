import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth'
import {
  ExamAlreadySubmittedError,
  getAttemptState,
  saveAttemptAnswers,
} from '@/services/exam.service'
import { saveExamAnswersSchema } from '@/lib/validations'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { attemptId } = await params
  const state = await getAttemptState(session.user.id, attemptId)
  if (!state) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(state)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = saveExamAnswersSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 })
  }

  const { attemptId } = await params
  try {
    const result = await saveAttemptAnswers(
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
      return NextResponse.json(
        { error: 'Attempt already submitted' },
        { status: 409 },
      )
    }
    throw error
  }
}
