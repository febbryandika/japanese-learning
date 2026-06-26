import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { examQuestionSchema } from '@/lib/validations'
import { addExamQuestion } from '@/services/admin/mock-exam.service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = examQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid question' }, { status: 400 })
  }

  const { id } = await params
  const created = await addExamQuestion(id, parsed.data)
  if (!created) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(created, { status: 201 })
}
