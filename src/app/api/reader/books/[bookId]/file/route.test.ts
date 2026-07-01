import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getSessionMock, fileUrlMock, getBlobMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  fileUrlMock: vi.fn(),
  getBlobMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getServerSession: getSessionMock }))
vi.mock('@/services/reader.service', () => ({
  getPublishedBookFileUrl: fileUrlMock,
}))
vi.mock('@vercel/blob', () => ({ get: getBlobMock }))

import { GET } from '@/app/api/reader/books/[bookId]/file/route'

const params = Promise.resolve({ bookId: 'b1' })
const req = () => new NextRequest('http://test/api/reader/books/b1/file')

describe('GET /api/reader/books/[bookId]/file', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null)
    const res = await GET(req(), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when the book is missing or unpublished', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u1' } })
    fileUrlMock.mockResolvedValue(null)
    const res = await GET(req(), { params })
    expect(res.status).toBe(404)
  })

  it('redirects to same-origin for a seeded /public path', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u1' } })
    fileUrlMock.mockResolvedValue('/books/kumo-no-ito.epub')
    const res = await GET(req(), { params })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://test/books/kumo-no-ito.epub')
    expect(getBlobMock).not.toHaveBeenCalled()
  })

  it('streams a private blob for a stored blob URL', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u1' } })
    fileUrlMock.mockResolvedValue('https://s.blob.vercel-storage.com/books/x.epub')
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token')
    getBlobMock.mockResolvedValue({
      stream: new ReadableStream(),
      blob: { contentType: 'application/epub+zip' },
    })
    const res = await GET(req(), { params })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/epub+zip')
    expect(getBlobMock).toHaveBeenCalledWith('books/x.epub', { access: 'private' })
    vi.unstubAllEnvs()
  })
})
