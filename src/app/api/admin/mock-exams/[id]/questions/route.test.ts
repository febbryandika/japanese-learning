import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireAdminMock, addQuestionMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  addQuestionMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireAdmin: requireAdminMock }))
vi.mock('@/services/admin/mock-exam.service', () => ({
  addExamQuestion: addQuestionMock,
}))

import { POST } from '@/app/api/admin/mock-exams/[id]/questions/route'

const params = Promise.resolve({ id: 'exam-1' })

function postRequest(body: unknown) {
  return new Request('http://test/api/admin/mock-exams/exam-1/questions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  sectionName: '文法',
  prompt: 'p',
  choices: ['A', 'B'],
  correctAnswer: 'A',
}

describe('POST /api/admin/mock-exams/[id]/questions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for a non-admin', async () => {
    requireAdminMock.mockResolvedValue({ ok: false, status: 403 })
    const res = await POST(postRequest(validBody), { params })
    expect(res.status).toBe(403)
    expect(addQuestionMock).not.toHaveBeenCalled()
  })

  it('returns 400 when correctAnswer is not among the choices', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    const res = await POST(
      postRequest({ ...validBody, correctAnswer: 'Z' }),
      { params },
    )
    expect(res.status).toBe(400)
    expect(addQuestionMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the exam does not exist', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    addQuestionMock.mockResolvedValue(null)
    const res = await POST(postRequest(validBody), { params })
    expect(res.status).toBe(404)
  })

  it('returns 201 when the question is created', async () => {
    requireAdminMock.mockResolvedValue({ ok: true, session: { user: { id: 'u1' } } })
    addQuestionMock.mockResolvedValue({ id: 'q1', examId: 'exam-1' })
    const res = await POST(postRequest(validBody), { params })
    expect(res.status).toBe(201)
    expect(addQuestionMock).toHaveBeenCalledTimes(1)
  })
})
