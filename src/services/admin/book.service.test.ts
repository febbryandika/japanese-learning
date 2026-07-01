import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dbMock, returningMock } = vi.hoisted(() => {
  const returningMock = vi.fn()
  const chain = {
    values: () => chain,
    set: () => chain,
    where: () => chain,
    returning: returningMock,
  }
  const dbMock = {
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
  }
  return { dbMock, returningMock }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import { createBook, deleteBook } from '@/services/admin/book.service'

describe('createBook', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the inserted row', async () => {
    const row = {
      id: 'b1',
      title: 'Kokoro',
      author: null,
      fileUrl: 'https://blob.example.com/kokoro.epub',
      coverUrl: null,
      isPublished: false,
    }
    returningMock.mockResolvedValue([row])
    await expect(
      createBook({
        title: 'Kokoro',
        fileUrl: 'https://blob.example.com/kokoro.epub',
        isPublished: false,
      }),
    ).resolves.toEqual(row)
  })
})

describe('deleteBook', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns id + fileUrl so the route can clean up the blob', async () => {
    returningMock.mockResolvedValue([
      { id: 'b1', fileUrl: 'https://blob.example.com/kokoro.epub' },
    ])
    await expect(deleteBook('b1')).resolves.toEqual({
      id: 'b1',
      fileUrl: 'https://blob.example.com/kokoro.epub',
    })
  })

  it('returns null when the book does not exist', async () => {
    returningMock.mockResolvedValue([])
    await expect(deleteBook('missing')).resolves.toBeNull()
  })
})
