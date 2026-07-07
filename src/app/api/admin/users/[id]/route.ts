import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { updateUserSchema } from '@/lib/validations'
import {
  deleteUserAdmin,
  getUserAdmin,
  updateUserAdmin,
} from '@/services/admin/user.service'
import { UniqueConstraintError } from '@/services/admin/errors'

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
  const user = await getUserAdmin(id)
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(user)
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
  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const { id } = await params

  // Self-protection: an admin can't disable or demote their own account.
  if (id === guard.session.user.id) {
    if (parsed.data.status === 'disabled' || parsed.data.role === 'learner') {
      return NextResponse.json(
        { error: 'You cannot disable or demote your own account' },
        { status: 400 },
      )
    }
  }

  try {
    const updated = await updateUserAdmin(id, parsed.data)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return NextResponse.json(
        { error: 'A user with that email already exists' },
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

  if (id === guard.session.user.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account' },
      { status: 400 },
    )
  }

  const deleted = await deleteUserAdmin(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
