import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dbMock, returningMock } = vi.hoisted(() => {
  const returningMock = vi.fn()
  const chain = {
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    returning: returningMock,
  }
  const dbMock = {
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
  }
  return { dbMock, returningMock }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import { createKanji, deleteKanji } from '@/services/admin/kanji.service'
import { UniqueConstraintError } from '@/services/admin/errors'

const validInput = {
  character: '読',
  onyomi: 'ドク',
  kunyomi: 'よ.む',
  meaning: 'read',
  strokeCount: 14,
  jlptLevel: 'N2' as const,
  notes: null,
}

describe('createKanji', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the inserted row', async () => {
    const row = { id: 'k1', ...validInput }
    returningMock.mockResolvedValue([row])
    await expect(createKanji(validInput)).resolves.toEqual(row)
  })

  it('maps a duplicate character (23505) to UniqueConstraintError', async () => {
    returningMock.mockRejectedValue(
      Object.assign(new Error('Failed query'), {
        cause: Object.assign(new Error('duplicate'), { code: '23505' }),
      }),
    )
    await expect(createKanji(validInput)).rejects.toBeInstanceOf(
      UniqueConstraintError,
    )
  })
})

describe('deleteKanji', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when no row was deleted', async () => {
    returningMock.mockResolvedValue([])
    await expect(deleteKanji('missing')).resolves.toBeNull()
  })
})
