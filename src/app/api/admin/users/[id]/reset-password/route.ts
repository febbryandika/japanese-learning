import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { resetPasswordSchema } from '@/lib/validations'
import { resetUserPasswordAdmin } from '@/services/admin/user.service'

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
  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { id } = await params
  const result = await resetUserPasswordAdmin(id, parsed.data)
  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(result)
}
