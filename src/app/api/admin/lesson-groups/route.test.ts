import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Guard + service are mocked: these tests verify the route wires the admin guard
// and validation to the right HTTP statuses, without touching the DB.
const { requireAdminMock, createMock, listMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createMock: vi.fn(),
  listMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/services/admin/lesson-group.service', () => ({
  createLessonGroup: createMock,
  listLessonGroupsAdmin: listMock,
}))

import { GET, POST } from '@/app/api/admin/lesson-groups/route'

function postRequest(body: unknown) {
  return new NextRequest('http://test/api/admin/lesson-groups', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/lesson-groups', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 401 })
    const res = await POST(postRequest({ slug: 'grammar', title: '文法' }))
    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await POST(postRequest({ slug: 'grammar', title: '文法' }))
    expect(res.status).toBe(403)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 400 for an admin with an invalid body', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    const res = await POST(postRequest({ slug: 'Bad Slug!', title: '' }))
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 201 for an admin with a valid body', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    createMock.mockResolvedValue({
      id: 'g1',
      slug: 'grammar',
      title: '文法',
      sortOrder: 0,
      isPublished: false,
    })
    const res = await POST(postRequest({ slug: 'grammar', title: '文法' }))
    expect(res.status).toBe(201)
    expect(createMock).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/admin/lesson-groups', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await GET(new NextRequest('http://test/api/admin/lesson-groups'))
    expect(res.status).toBe(403)
    expect(listMock).not.toHaveBeenCalled()
  })

  it('returns 200 with paginated data for an admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    listMock.mockResolvedValue({ items: [], total: 0 })
    const res = await GET(new NextRequest('http://test/api/admin/lesson-groups'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ data: [], pagination: { page: 1, pageSize: 20 } })
  })
})
