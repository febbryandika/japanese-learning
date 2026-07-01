import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { requireAdminMock, createMock, listMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createMock: vi.fn(),
  listMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/services/admin/book.service', () => ({
  createBook: createMock,
  listBooksAdmin: listMock,
}))

import { GET, POST } from '@/app/api/admin/reader/books/route'

function postRequest(body: unknown) {
  return new NextRequest('http://test/api/admin/reader/books', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  title: 'Kokoro',
  fileUrl: 'https://blob.example.com/kokoro.epub',
}

describe('POST /api/admin/reader/books', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 401 })
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(403)
  })

  it('returns 400 when fileUrl is missing/invalid', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    const res = await POST(postRequest({ title: 'Kokoro' }))
    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns 201 for an admin with a valid body', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    createMock.mockResolvedValue({ id: 'b1', ...validBody })
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(201)
    expect(createMock).toHaveBeenCalledTimes(1)
  })
})

describe('GET /api/admin/reader/books', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await GET(new NextRequest('http://test/api/admin/reader/books'))
    expect(res.status).toBe(403)
    expect(listMock).not.toHaveBeenCalled()
  })

  it('returns 200 with paginated data for an admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    listMock.mockResolvedValue({ items: [], total: 0 })
    const res = await GET(new NextRequest('http://test/api/admin/reader/books'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ data: [], pagination: { page: 1, pageSize: 20 } })
  })
})
