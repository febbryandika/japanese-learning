import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateKanjiSchema } from '@/lib/validations'
import { deleteKanji, updateKanji } from '@/services/admin/kanji.service'
import { UniqueConstraintError } from '@/services/admin/errors'

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
  const parsed = updateKanjiSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid kanji' }, { status: 400 })
  }

  const { id } = await params
  try {
    const updated = await updateKanji(id, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return NextResponse.json(
        { error: 'A kanji with that character already exists' },
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
  const deleted = await deleteKanji(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
