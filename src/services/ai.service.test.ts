import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoisted so the vi.mock factories below can reference them (vi.mock is lifted
// above imports). `ai` and `@/lib/db` are mocked so no real OpenAI call or DB
// connection happens.
const { generateObjectMock, insertMock, valuesMock, returningMock } = vi.hoisted(
  () => {
    const returningMock = vi.fn()
    const valuesMock = vi.fn(() => ({ returning: returningMock }))
    const insertMock = vi.fn(() => ({ values: valuesMock }))
    const generateObjectMock = vi.fn()
    return { generateObjectMock, insertMock, valuesMock, returningMock }
  },
)

vi.mock('ai', () => ({ generateObject: generateObjectMock }))
vi.mock('@ai-sdk/openai', () => ({ openai: (model: string) => ({ model }) }))
vi.mock('@/lib/db', () => ({ db: { insert: insertMock } }))

import {
  exampleOutputSchema,
  generateExample,
} from '@/services/ai.service'

describe('exampleOutputSchema', () => {
  it('accepts a valid object', () => {
    const parsed = exampleOutputSchema.safeParse({
      sentence_ja: 'これはテストです。',
      sentence_reading: 'これはてすとです。',
      sentence_translation_en: 'This is a test.',
    })
    expect(parsed.success).toBe(true)
  })

  it('treats sentence_reading as optional', () => {
    const parsed = exampleOutputSchema.safeParse({
      sentence_ja: 'テスト。',
      sentence_translation_en: 'Test.',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects an empty sentence_ja', () => {
    const parsed = exampleOutputSchema.safeParse({
      sentence_ja: '',
      sentence_translation_en: 'Test.',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects a missing translation', () => {
    const parsed = exampleOutputSchema.safeParse({ sentence_ja: 'テスト。' })
    expect(parsed.success).toBe(false)
  })
})

describe('generateExample', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses model output, persists it with the right metadata, and returns the saved row', async () => {
    generateObjectMock.mockResolvedValue({
      object: {
        sentence_ja: '彼は本を読むばかりか、書きもする。',
        sentence_reading: 'かれはほんをよむばかりか、かきもする。',
        sentence_translation_en:
          'He not only reads books but also writes them.',
      },
    })
    const savedRow = {
      id: 'gen1',
      sentenceJa: '彼は本を読むばかりか、書きもする。',
      sentenceReading: 'かれはほんをよむばかりか、かきもする。',
      sentenceTranslationEn: 'He not only reads books but also writes them.',
      modelName: 'gpt-4o-mini',
      status: 'pending' as const,
      createdAt: new Date(0),
    }
    returningMock.mockResolvedValue([savedRow])

    const result = await generateExample('grammar', 'grammar-1', {
      subject: '〜ばかりか',
      meaning: 'not only ... but also',
    })

    expect(generateObjectMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: 'grammar',
        sourceId: 'grammar-1',
        modelName: 'gpt-4o-mini',
        promptVersion: 'v1',
        status: 'pending',
        sentenceJa: '彼は本を読むばかりか、書きもする。',
        sentenceTranslationEn: 'He not only reads books but also writes them.',
      }),
    )
    expect(result).toEqual(savedRow)
  })

  it('persists null when the model omits the reading', async () => {
    generateObjectMock.mockResolvedValue({
      object: {
        sentence_ja: '影響を受ける。',
        sentence_translation_en: 'To be influenced.',
      },
    })
    returningMock.mockResolvedValue([
      {
        id: 'gen2',
        sentenceJa: '影響を受ける。',
        sentenceReading: null,
        sentenceTranslationEn: 'To be influenced.',
        modelName: 'gpt-4o-mini',
        status: 'pending' as const,
        createdAt: new Date(0),
      },
    ])

    await generateExample('vocabulary', 'vocab-1', {
      subject: '影響',
      meaning: 'influence',
    })

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ sentenceReading: null }),
    )
  })
})
