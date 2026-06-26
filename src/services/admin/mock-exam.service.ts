import { and, asc, count, desc, eq, ilike, type SQL } from 'drizzle-orm'

import { db } from '@/lib/db'
import { mockExamQuestions, mockExams } from '@/lib/db/schema'
import type {
  AdminListQuery,
  CreateMockExamInput,
  ExamQuestionInput,
  UpdateExamQuestionInput,
  UpdateMockExamInput,
} from '@/lib/validations'
import { mapPgError } from '@/services/admin/errors'

export type AdminMockExam = {
  id: string
  title: string
  description: string | null
  timeLimitMinutes: number
  isPublished: boolean
  questionCount: number
}

export type AdminExamQuestion = {
  id: string
  examId: string
  sectionName: string
  prompt: string
  choices: string[]
  correctAnswer: string
  explanation: string | null
  sortOrder: number
}

export type AdminMockExamDetail = Omit<AdminMockExam, 'questionCount'> & {
  questions: AdminExamQuestion[]
}

const examColumns = {
  id: mockExams.id,
  title: mockExams.title,
  description: mockExams.description,
  timeLimitMinutes: mockExams.timeLimitMinutes,
  isPublished: mockExams.isPublished,
}

const questionColumns = {
  id: mockExamQuestions.id,
  examId: mockExamQuestions.examId,
  sectionName: mockExamQuestions.sectionName,
  prompt: mockExamQuestions.prompt,
  choices: mockExamQuestions.choices,
  correctAnswer: mockExamQuestions.correctAnswer,
  explanation: mockExamQuestions.explanation,
  sortOrder: mockExamQuestions.sortOrder,
}

// `choices` is a JSON-stringified string[]; malformed data degrades to [].
function parseChoices(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((c): c is string => typeof c === 'string')
      : []
  } catch {
    return []
  }
}

type QuestionRow = Omit<AdminExamQuestion, 'choices'> & { choices: string }

function toQuestion(row: QuestionRow): AdminExamQuestion {
  return { ...row, choices: parseChoices(row.choices) }
}

// ─── Exams ──────────────────────────────────────────────────────────────────

export async function listMockExamsAdmin({
  q,
  page,
  pageSize,
}: AdminListQuery): Promise<{ items: AdminMockExam[]; total: number }> {
  const filters: SQL[] = []
  if (q) {
    filters.push(ilike(mockExams.title, `%${q}%`))
  }
  const where = filters.length ? and(...filters) : undefined

  const [items, totalResult] = await Promise.all([
    db
      .select({
        ...examColumns,
        questionCount: count(mockExamQuestions.id),
      })
      .from(mockExams)
      .leftJoin(mockExamQuestions, eq(mockExamQuestions.examId, mockExams.id))
      .where(where)
      .groupBy(mockExams.id)
      .orderBy(desc(mockExams.createdAt), asc(mockExams.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(mockExams).where(where),
  ])

  return { items, total: totalResult[0]?.total ?? 0 }
}

export async function createMockExam(
  input: CreateMockExamInput,
): Promise<AdminMockExam> {
  const [row] = await db.insert(mockExams).values(input).returning(examColumns)
  return { ...row, questionCount: 0 }
}

export async function updateMockExam(
  id: string,
  input: UpdateMockExamInput,
): Promise<Omit<AdminMockExam, 'questionCount'> | null> {
  if (Object.keys(input).length === 0) {
    const [row] = await db
      .select(examColumns)
      .from(mockExams)
      .where(eq(mockExams.id, id))
      .limit(1)
    return row ?? null
  }

  const [row] = await db
    .update(mockExams)
    .set(input)
    .where(eq(mockExams.id, id))
    .returning(examColumns)
  return row ?? null
}

export async function deleteMockExam(
  id: string,
): Promise<{ id: string } | null> {
  // Questions cascade with the exam (schema FK onDelete cascade).
  const [row] = await db
    .delete(mockExams)
    .where(eq(mockExams.id, id))
    .returning({ id: mockExams.id })
  return row ?? null
}

// Admin detail INCLUDES the answer key (correctAnswer/explanation) for editing —
// distinct from the learner-facing /api/mock-exams/[id] which never exposes it.
export async function getMockExamAdmin(
  id: string,
): Promise<AdminMockExamDetail | null> {
  const [exam] = await db
    .select(examColumns)
    .from(mockExams)
    .where(eq(mockExams.id, id))
    .limit(1)
  if (!exam) return null

  const rows = await db
    .select(questionColumns)
    .from(mockExamQuestions)
    .where(eq(mockExamQuestions.examId, id))
    .orderBy(asc(mockExamQuestions.sortOrder), asc(mockExamQuestions.id))

  return { ...exam, questions: rows.map(toQuestion) }
}

// ─── Questions ────────────────────────────────────────────────────────────────

async function examExists(examId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: mockExams.id })
    .from(mockExams)
    .where(eq(mockExams.id, examId))
    .limit(1)
  return Boolean(row)
}

export async function addExamQuestion(
  examId: string,
  input: ExamQuestionInput,
): Promise<AdminExamQuestion | null> {
  if (!(await examExists(examId))) return null

  const [row] = await db
    .insert(mockExamQuestions)
    .values({
      examId,
      sectionName: input.sectionName,
      prompt: input.prompt,
      choices: JSON.stringify(input.choices),
      correctAnswer: input.correctAnswer,
      explanation: input.explanation ?? null,
      sortOrder: input.sortOrder,
    })
    .returning(questionColumns)
  return toQuestion(row)
}

export async function updateExamQuestion(
  examId: string,
  questionId: string,
  input: UpdateExamQuestionInput,
): Promise<AdminExamQuestion | null> {
  const updates: Record<string, unknown> = {}
  if (input.sectionName !== undefined) updates.sectionName = input.sectionName
  if (input.prompt !== undefined) updates.prompt = input.prompt
  if (input.choices !== undefined) updates.choices = JSON.stringify(input.choices)
  if (input.correctAnswer !== undefined)
    updates.correctAnswer = input.correctAnswer
  if (input.explanation !== undefined) updates.explanation = input.explanation
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder

  const where = and(
    eq(mockExamQuestions.id, questionId),
    eq(mockExamQuestions.examId, examId),
  )

  if (Object.keys(updates).length === 0) {
    const [row] = await db
      .select(questionColumns)
      .from(mockExamQuestions)
      .where(where)
      .limit(1)
    return row ? toQuestion(row) : null
  }

  const [row] = await db
    .update(mockExamQuestions)
    .set(updates)
    .where(where)
    .returning(questionColumns)
  return row ? toQuestion(row) : null
}

export async function deleteExamQuestion(
  examId: string,
  questionId: string,
): Promise<{ id: string } | null> {
  try {
    const [row] = await db
      .delete(mockExamQuestions)
      .where(
        and(
          eq(mockExamQuestions.id, questionId),
          eq(mockExamQuestions.examId, examId),
        ),
      )
      .returning({ id: mockExamQuestions.id })
    return row ?? null
  } catch (error) {
    // A question already answered in an attempt is referenced by
    // mock_exam_attempt_answers (no cascade) → FK violation.
    mapPgError(error)
  }
}
