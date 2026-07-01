import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { requireAdminMock, createMock, listMock, putMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createMock: vi.fn(),
  listMock: vi.fn(),
  putMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/services/admin/book.service', () => ({
  createBook: createMock,
  listBooksAdmin: listMock,
}))
vi.mock('@vercel/blob', () => ({ put: putMock }))

import { GET, POST } from '@/app/api/admin/reader/books/route'

// The route only calls request.formData(); a minimal fake keeps the test
// deterministic (no real multipart parsing).
function formRequest(fields: Record<string, string | File>): Request {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  return { formData: async () => fd } as unknown as Request
}

const epubFile = () =>
  new File([new Uint8Array([80, 75, 3, 4])], 'book.epub', {
    type: 'application/epub+zip',
  })

describe('POST /api/admin/reader/books', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('returns 401 when unauthenticated', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 401 })
    const res = await POST(formRequest({}))
    expect(res.status).toBe(401)
    expect(putMock).not.toHaveBeenCalled()
  })

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await POST(formRequest({}))
    expect(res.status).toBe(403)
  })

  it('returns 503 when the blob token is missing', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '')
    const res = await POST(formRequest({ file: epubFile(), title: 'Kokoro' }))
    expect(res.status).toBe(503)
  })

  it('returns 400 when no file is provided', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    const res = await POST(formRequest({ title: 'Kokoro', isPublished: 'false' }))
    expect(res.status).toBe(400)
    expect(putMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the title is empty', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    const res = await POST(formRequest({ file: epubFile(), title: '' }))
    expect(res.status).toBe(400)
    expect(putMock).not.toHaveBeenCalled()
  })

  it('puts a private blob and persists the row (201)', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    putMock.mockResolvedValue({ url: 'https://s.blob.vercel-storage.com/books/x.epub' })
    createMock.mockResolvedValue({ id: 'b1', title: 'Kokoro' })
    const res = await POST(
      formRequest({ file: epubFile(), title: 'Kokoro', isPublished: 'true' }),
    )
    expect(res.status).toBe(201)
    expect(putMock).toHaveBeenCalledWith(
      expect.stringMatching(/^books\/.*\.epub$/),
      expect.any(File),
      expect.objectContaining({ access: 'private' }),
    )
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Kokoro',
        isPublished: true,
        fileUrl: 'https://s.blob.vercel-storage.com/books/x.epub',
      }),
    )
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
