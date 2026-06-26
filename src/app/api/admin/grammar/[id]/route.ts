import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateGrammarSchema } from '@/lib/validations'
import { deleteGrammar, updateGrammar } from '@/services/admin/grammar.service'

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
  const parsed = updateGrammarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid grammar pattern' }, { status: 400 })
  }

  const { id } = await params
  const updated = await updateGrammar(id, parsed.data)
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
  const deleted = await deleteGrammar(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
