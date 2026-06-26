import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateExamQuestionSchema } from '@/lib/validations'
import {
  deleteExamQuestion,
  updateExamQuestion,
} from '@/services/admin/mock-exam.service'
import { ForeignKeyError } from '@/services/admin/errors'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = updateExamQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid question' }, { status: 400 })
  }

  const { id, questionId } = await params
  const updated = await updateExamQuestion(id, questionId, parsed.data)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const { id, questionId } = await params
  try {
    const deleted = await deleteExamQuestion(id, questionId)
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(deleted)
  } catch (error) {
    if (error instanceof ForeignKeyError) {
      return NextResponse.json(
        { error: 'This question has learner answers and cannot be deleted' },
        { status: 409 },
      )
    }
    throw error
  }
}
