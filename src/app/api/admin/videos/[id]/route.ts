import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateVideoSchema } from '@/lib/validations'
import { deleteVideo, updateVideo } from '@/services/admin/video.service'
import { ForeignKeyError } from '@/services/admin/errors'

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
  const parsed = updateVideoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid video lesson' }, { status: 400 })
  }

  const { id } = await params
  try {
    const updated = await updateVideo(id, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ForeignKeyError) {
      return NextResponse.json(
        { error: 'Selected lesson group does not exist' },
        { status: 400 },
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
  const deleted = await deleteVideo(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
