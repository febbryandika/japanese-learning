import { beforeEach, describe, expect, it, vi } from 'vitest'

const { dbMock, limitMock, returningMock, valuesMock } = vi.hoisted(() => {
  const limitMock = vi.fn()
  const returningMock = vi.fn()
  const valuesMock = vi.fn()
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: limitMock,
    values: (arg: unknown) => {
      valuesMock(arg)
      return chain
    },
    set: () => chain,
    orderBy: () => chain,
    returning: returningMock,
  }
  const dbMock = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
  }
  return { dbMock, limitMock, returningMock, valuesMock }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

import {
  addExamQuestion,
  deleteExamQuestion,
} from '@/services/admin/mock-exam.service'
import { ForeignKeyError } from '@/services/admin/errors'
import { examQuestionSchema } from '@/lib/validations'

const questionInput = {
  sectionName: '文法' as const,
  prompt: '彼は忙しい（　）、手伝ってくれた。',
  choices: ['にもかかわらず', 'ものなら', 'どころか'],
  correctAnswer: 'にもかかわらず',
  explanation: null,
  sortOrder: 0,
}

describe('addExamQuestion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stringifies choices on write and parses them back on return', async () => {
    limitMock.mockResolvedValue([{ id: 'exam-1' }]) // examExists → true
    returningMock.mockResolvedValue([
      {
        id: 'q1',
        examId: 'exam-1',
        sectionName: '文法',
        prompt: questionInput.prompt,
        choices: JSON.stringify(questionInput.choices),
        correctAnswer: 'にもかかわらず',
        explanation: null,
        sortOrder: 0,
      },
    ])

    const result = await addExamQuestion('exam-1', questionInput)

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        examId: 'exam-1',
        choices: JSON.stringify(questionInput.choices),
        correctAnswer: 'にもかかわらず',
      }),
    )
    expect(result?.choices).toEqual(questionInput.choices)
  })

  it('returns null when the exam does not exist', async () => {
    limitMock.mockResolvedValue([]) // examExists → false
    await expect(addExamQuestion('missing', questionInput)).resolves.toBeNull()
  })
})

describe('deleteExamQuestion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when the question is not found', async () => {
    returningMock.mockResolvedValue([])
    await expect(deleteExamQuestion('exam-1', 'missing')).resolves.toBeNull()
  })

  it('maps a FK violation (already answered) to ForeignKeyError', async () => {
    returningMock.mockRejectedValue(
      Object.assign(new Error('Failed query'), {
        cause: Object.assign(new Error('referenced'), { code: '23503' }),
      }),
    )
    await expect(deleteExamQuestion('exam-1', 'q1')).rejects.toBeInstanceOf(
      ForeignKeyError,
    )
  })
})

describe('examQuestionSchema', () => {
  it('rejects when correctAnswer is not one of the choices', () => {
    const result = examQuestionSchema.safeParse({
      sectionName: '文法',
      prompt: 'p',
      choices: ['A', 'B'],
      correctAnswer: 'C',
    })
    expect(result.success).toBe(false)
  })

  it('accepts when correctAnswer is one of the choices', () => {
    const result = examQuestionSchema.safeParse({
      sectionName: '文法',
      prompt: 'p',
      choices: ['A', 'B'],
      correctAnswer: 'B',
    })
    expect(result.success).toBe(true)
  })

  it('rejects fewer than two choices', () => {
    const result = examQuestionSchema.safeParse({
      sectionName: '文法',
      prompt: 'p',
      choices: ['A'],
      correctAnswer: 'A',
    })
    expect(result.success).toBe(false)
  })
})
