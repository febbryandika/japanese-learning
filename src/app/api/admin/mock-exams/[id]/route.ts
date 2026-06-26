import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateMockExamSchema } from '@/lib/validations'
import {
  deleteMockExam,
  getMockExamAdmin,
  updateMockExam,
} from '@/services/admin/mock-exam.service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const { id } = await params
  const exam = await getMockExamAdmin(id)
  if (!exam) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(exam)
}

export async function PATCH(
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
  const parsed = updateMockExamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid mock exam' }, { status: 400 })
  }

  const { id } = await params
  const updated = await updateMockExam(id, parsed.data)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: guard.status },
    )
  }

  const { id } = await params
  const deleted = await deleteMockExam(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
