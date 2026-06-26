import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateVocabularySchema } from '@/lib/validations'
import {
  deleteVocabulary,
  updateVocabulary,
} from '@/services/admin/vocabulary.service'

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
  const parsed = updateVocabularySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vocabulary' }, { status: 400 })
  }

  const { id } = await params
  const updated = await updateVocabulary(id, parsed.data)
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
  const deleted = await deleteVocabulary(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
