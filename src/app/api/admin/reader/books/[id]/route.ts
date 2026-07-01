import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'

import { requireAdmin } from '@/lib/auth'
import { updateBookSchema } from '@/lib/validations'
import { deleteBook, updateBook } from '@/services/admin/book.service'

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
  const parsed = updateBookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid book' }, { status: 400 })
  }

  const { id } = await params
  const updated = await updateBook(id, parsed.data)
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
  const deleted = await deleteBook(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Best-effort blob cleanup — the DB row (and its reader_progress) is already
  // gone; a non-Blob fileUrl (e.g. a seeded /public path) or missing token just
  // leaves an orphaned blob rather than failing the request.
  try {
    await del(deleted.fileUrl)
  } catch {
    // ignore
  }

  return NextResponse.json({ id: deleted.id })
}
