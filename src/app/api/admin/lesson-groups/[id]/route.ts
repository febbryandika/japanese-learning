import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateLessonGroupSchema } from '@/lib/validations'
import {
  deleteLessonGroup,
  updateLessonGroup,
} from '@/services/admin/lesson-group.service'
import { ForeignKeyError, UniqueConstraintError } from '@/services/admin/errors'

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
  const parsed = updateLessonGroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lesson group' }, { status: 400 })
  }

  const { id } = await params
  try {
    const updated = await updateLessonGroup(id, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return NextResponse.json(
        { error: 'A lesson group with that slug already exists' },
        { status: 409 },
      )
    }
    throw error
  }
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
  try {
    const deleted = await deleteLessonGroup(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(deleted)
  } catch (error) {
    if (error instanceof ForeignKeyError) {
      return NextResponse.json(
        { error: 'This lesson group still has videos and cannot be deleted' },
        { status: 409 },
      )
    }
    throw error
  }
}
