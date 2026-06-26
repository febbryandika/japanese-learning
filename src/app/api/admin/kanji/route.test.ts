import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { requireAdminMock, createMock, listMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createMock: vi.fn(),
  listMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/services/admin/kanji.service', () => ({
  createKanji: createMock,
  listKanjiAdmin: listMock,
}))

import { GET, POST } from '@/app/api/admin/kanji/route'

function postRequest(body: unknown) {
  return new NextRequest('http://test/api/admin/kanji', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/kanji', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 401 })
    const res = await POST(postRequest({ character: '読', meaning: 'read' }))
    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await POST(postRequest({ character: '読', meaning: 'read' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid body (character must be one char)', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    const res = await POST(postRequest({ character: '読む', meaning: 'read' }))
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 201 for an admin with a valid body', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    createMock.mockResolvedValue({ id: 'k1', character: '読', meaning: 'read' })
    const res = await POST(postRequest({ character: '読', meaning: 'read' }))
    expect(res.status).toBe(201)
    expect(createMock).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/admin/kanji', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await GET(new NextRequest('http://test/api/admin/kanji'))
    expect(res.status).toBe(403)
    expect(listMock).not.toHaveBeenCalled()
  })

  it('returns 200 with paginated data for an admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    listMock.mockResolvedValue({ items: [], total: 0 })
    const res = await GET(new NextRequest('http://test/api/admin/kanji'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ data: [], pagination: { page: 1, pageSize: 20 } })
  })
})
