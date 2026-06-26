import { beforeEach, describe, expect, it, vi } from 'vitest'

// One chainable mock for the Drizzle builder; `set`/`values` are captured so we
// can assert what reaches the column writes, and `.returning()` drives the result.
const { dbMock, returningMock, setMock } = vi.hoisted(() => {
  const returningMock = vi.fn()
  const setMock = vi.fn()
  const chain: Record<string, unknown> = {
    values: () => chain,
    set: (arg: unknown) => {
      setMock(arg)
      return chain
    },
    where: () => chain,
    leftJoin: () => chain,
    from: () => chain,
    limit: () => chain,
    returning: returningMock,
  }
  const dbMock = {
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    select: () => chain,
  }
  return { dbMock, returningMock, setMock }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import { createVideo, updateVideo } from '@/services/admin/video.service'
import { ForeignKeyError } from '@/services/admin/errors'

const row = {
  id: 'v1',
  lessonGroupId: 'g1',
  title: 'Lesson',
  description: null,
  embedUrl: null,
  durationSeconds: null,
  sortOrder: 0,
  isPublished: false,
}

describe('createVideo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the created row with a null groupTitle', async () => {
    returningMock.mockResolvedValue([row])
    await expect(
      createVideo({ lessonGroupId: 'g1', title: 'Lesson', sortOrder: 0, isPublished: false }),
    ).resolves.toMatchObject({ id: 'v1', groupTitle: null })
  })

  it('maps a foreign-key violation to ForeignKeyError', async () => {
    returningMock.mockRejectedValue(
      Object.assign(new Error('Failed query'), {
        cause: Object.assign(new Error('fk'), { code: '23503' }),
      }),
    )
    await expect(
      createVideo({ lessonGroupId: 'missing', title: 'Lesson', sortOrder: 0, isPublished: false }),
    ).rejects.toBeInstanceOf(ForeignKeyError)
  })
})

describe('updateVideo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes null through to clear an optional column (merge-patch clear)', async () => {
    returningMock.mockResolvedValue([row])
    const result = await updateVideo('v1', {
      title: 'Lesson',
      embedUrl: null,
      description: null,
    })
    expect(setMock).toHaveBeenCalledWith({
      title: 'Lesson',
      embedUrl: null,
      description: null,
    })
    expect(result).toMatchObject({ embedUrl: null, description: null })
  })

  it('returns null when the row does not exist', async () => {
    returningMock.mockResolvedValue([])
    await expect(updateVideo('missing', { title: 'x' })).resolves.toBeNull()
  })
})
