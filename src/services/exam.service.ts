import { and, asc, count, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  mockExams,
  mockExamQuestions,
  mockExamAttempts,
  mockExamAttemptAnswers,
} from '@/lib/db/schema'
import {
  EXAM_SECTIONS,
  examReviewResponseSchema,
  type ExamAnswerInput,
  type ExamReviewQuestion,
  type ExamReviewResponse,
  type ExamReviewSectionScore,
} from '@/lib/validations'

// Questions exposed to the client never include `correctAnswer`/`explanation`:
// scoring is server-authoritative, so the answer key must not leave the server.
const publicQuestionColumns = {
  id: mockExamQuestions.id,
  sectionName: mockExamQuestions.sectionName,
  prompt: mockExamQuestions.prompt,
  choices: mockExamQuestions.choices,
  sortOrder: mockExamQuestions.sortOrder,
}

export type MockExamListItem = {
  id: string
  title: string
  description: string | null
  timeLimitMinutes: number
  questionCount: number
}

export type ExamSectionSummary = {
  sectionName: string
  questionCount: number
}

export type MockExamDetail = {
  id: string
  title: string
  description: string | null
  timeLimitMinutes: number
  questionCount: number
  sections: ExamSectionSummary[]
}

export type AttemptQuestion = {
  id: string
  sectionName: string
  prompt: string
  choices: string[]
  sortOrder: number
}

export type AttemptState = {
  id: string
  examId: string
  status: 'in_progress' | 'submitted'
  startedAt: Date
  timeLimitMinutes: number
  exam: { id: string; title: string }
  questions: AttemptQuestion[]
  answers: Record<string, string> // questionId → userAnswer
  scoreTotal: number | null
  scoreMax: number | null
}

export type SubmitResult = {
  scoreTotal: number
  scoreMax: number
  percentage: number
}

// Thrown when a write targets an already-submitted attempt (route → 409). Carries
// the stored result so a duplicate submit can still surface the final score.
export class ExamAlreadySubmittedError extends Error {
  result?: SubmitResult
  constructor(result?: SubmitResult) {
    super('Attempt already submitted')
    this.name = 'ExamAlreadySubmittedError'
    this.result = result
  }
}

// Thrown when review is requested for an attempt that hasn't been submitted yet
// (route → 409). Review exposes the answer key, so it must stay gated until submit.
export class AttemptNotSubmittedError extends Error {
  constructor() {
    super('Attempt not submitted')
    this.name = 'AttemptNotSubmittedError'
  }
}

function percentage(scoreTotal: number, scoreMax: number): number {
  return scoreMax === 0 ? 0 : Math.round((scoreTotal / scoreMax) * 100)
}

// Canonical JLPT section order (EXAM_SECTIONS); unknown sections sort last.
function sectionRank(name: string): number {
  const idx = (EXAM_SECTIONS as readonly string[]).indexOf(name)
  return idx === -1 ? EXAM_SECTIONS.length : idx
}

// `choices` is a JSON-stringified string[]; malformed data degrades to [].
function parseChoices(choices: string): string[] {
  try {
    const parsed: unknown = JSON.parse(choices)
    return Array.isArray(parsed)
      ? parsed.filter((c): c is string => typeof c === 'string')
      : []
  } catch {
    return []
  }
}

// GET /api/mock-exams — published exams with their question count.
export async function listPublishedExams(): Promise<MockExamListItem[]> {
  const exams = await db
    .select({
      id: mockExams.id,
      title: mockExams.title,
      description: mockExams.description,
      timeLimitMinutes: mockExams.timeLimitMinutes,
    })
    .from(mockExams)
    .where(eq(mockExams.isPublished, true))
    .orderBy(asc(mockExams.createdAt))

  if (exams.length === 0) return []

  const counts = await db
    .select({ examId: mockExamQuestions.examId, total: count() })
    .from(mockExamQuestions)
    .groupBy(mockExamQuestions.examId)
  const countByExam = new Map(counts.map((c) => [c.examId, c.total]))

  return exams.map((e) => ({ ...e, questionCount: countByExam.get(e.id) ?? 0 }))
}

// GET /api/mock-exams/[id] — meta + section overview (no question bodies, so the
// answer key is never even queried here). `null` if missing or unpublished.
export async function getMockExamDetail(
  examId: string,
): Promise<MockExamDetail | null> {
  const [exam] = await db
    .select({
      id: mockExams.id,
      title: mockExams.title,
      description: mockExams.description,
      timeLimitMinutes: mockExams.timeLimitMinutes,
    })
    .from(mockExams)
    .where(and(eq(mockExams.id, examId), eq(mockExams.isPublished, true)))
    .limit(1)

  if (!exam) return null

  const sectionRows = await db
    .select({ sectionName: mockExamQuestions.sectionName, total: count() })
    .from(mockExamQuestions)
    .where(eq(mockExamQuestions.examId, examId))
    .groupBy(mockExamQuestions.sectionName)

  const sections = sectionRows
    .map((r) => ({ sectionName: r.sectionName, questionCount: r.total }))
    .sort((a, b) => sectionRank(a.sectionName) - sectionRank(b.sectionName))

  const questionCount = sections.reduce((sum, s) => sum + s.questionCount, 0)

  return { ...exam, questionCount, sections }
}

// POST /api/mock-exams/[id]/attempts — resume the user's open attempt if one
// exists, else create a fresh one. `null` if the exam is missing/unpublished.
export async function createOrResumeAttempt(
  userId: string,
  examId: string,
): Promise<{ attemptId: string; resumed: boolean } | null> {
  const [exam] = await db
    .select({ id: mockExams.id })
    .from(mockExams)
    .where(and(eq(mockExams.id, examId), eq(mockExams.isPublished, true)))
    .limit(1)
  if (!exam) return null

  return db.transaction(async (tx) => {
    // Lock any existing open attempt so a concurrent submit can't race the check.
    const [existing] = await tx
      .select({ id: mockExamAttempts.id })
      .from(mockExamAttempts)
      .where(
        and(
          eq(mockExamAttempts.userId, userId),
          eq(mockExamAttempts.examId, examId),
          eq(mockExamAttempts.status, 'in_progress'),
        ),
      )
      .for('update')
      .limit(1)

    if (existing) return { attemptId: existing.id, resumed: true }

    const [created] = await tx
      .insert(mockExamAttempts)
      .values({ userId, examId })
      .returning({ id: mockExamAttempts.id })

    return { attemptId: created.id, resumed: false }
  })
}

// GET /api/mock-exam-attempts/[attemptId] — own attempt only (`null` → 404).
// Returns everything the client needs to render and resume (timer anchored to
// startedAt, saved answers, stripped questions).
export async function getAttemptState(
  userId: string,
  attemptId: string,
): Promise<AttemptState | null> {
  const [attempt] = await db
    .select({
      id: mockExamAttempts.id,
      examId: mockExamAttempts.examId,
      status: mockExamAttempts.status,
      startedAt: mockExamAttempts.startedAt,
      scoreTotal: mockExamAttempts.scoreTotal,
      scoreMax: mockExamAttempts.scoreMax,
      examTitle: mockExams.title,
      timeLimitMinutes: mockExams.timeLimitMinutes,
    })
    .from(mockExamAttempts)
    .innerJoin(mockExams, eq(mockExams.id, mockExamAttempts.examId))
    .where(
      and(
        eq(mockExamAttempts.id, attemptId),
        eq(mockExamAttempts.userId, userId),
      ),
    )
    .limit(1)

  if (!attempt) return null

  const questionRows = await db
    .select(publicQuestionColumns)
    .from(mockExamQuestions)
    .where(eq(mockExamQuestions.examId, attempt.examId))
    .orderBy(asc(mockExamQuestions.sortOrder))

  const questions: AttemptQuestion[] = questionRows.map((q) => ({
    id: q.id,
    sectionName: q.sectionName,
    prompt: q.prompt,
    choices: parseChoices(q.choices),
    sortOrder: q.sortOrder,
  }))

  const answerRows = await db
    .select({
      questionId: mockExamAttemptAnswers.questionId,
      userAnswer: mockExamAttemptAnswers.userAnswer,
    })
    .from(mockExamAttemptAnswers)
    .where(eq(mockExamAttemptAnswers.attemptId, attemptId))

  const answers: Record<string, string> = {}
  for (const a of answerRows) answers[a.questionId] = a.userAnswer

  return {
    id: attempt.id,
    examId: attempt.examId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    timeLimitMinutes: attempt.timeLimitMinutes,
    exam: { id: attempt.examId, title: attempt.examTitle },
    questions,
    answers,
    scoreTotal: attempt.scoreTotal,
    scoreMax: attempt.scoreMax,
  }
}

// Resolve the set of question ids that belong to an attempt's exam — used to drop
// any foreign questionId before persisting answers.
async function examQuestionIds(examId: string): Promise<Set<string>> {
  const rows = await db
    .select({ id: mockExamQuestions.id })
    .from(mockExamQuestions)
    .where(eq(mockExamQuestions.examId, examId))
  return new Set(rows.map((r) => r.id))
}

// PATCH /api/mock-exam-attempts/[attemptId] — persist in-progress answers.
// `null` → 404; throws ExamAlreadySubmittedError → 409. Empty answers is a no-op.
export async function saveAttemptAnswers(
  userId: string,
  attemptId: string,
  answers: ExamAnswerInput[],
): Promise<{ saved: number } | null> {
  const [attempt] = await db
    .select({
      id: mockExamAttempts.id,
      examId: mockExamAttempts.examId,
      status: mockExamAttempts.status,
    })
    .from(mockExamAttempts)
    .where(
      and(
        eq(mockExamAttempts.id, attemptId),
        eq(mockExamAttempts.userId, userId),
      ),
    )
    .limit(1)

  if (!attempt) return null
  if (attempt.status === 'submitted') throw new ExamAlreadySubmittedError()
  if (answers.length === 0) return { saved: 0 }

  const validIds = await examQuestionIds(attempt.examId)
  const valid = answers.filter((a) => validIds.has(a.questionId))

  for (const a of valid) {
    // `isCorrect` is provisional here (never read before submit recomputes it);
    // the conflict update keeps the latest userAnswer.
    await db
      .insert(mockExamAttemptAnswers)
      .values({
        attemptId,
        questionId: a.questionId,
        userAnswer: a.userAnswer,
        isCorrect: false,
      })
      .onConflictDoUpdate({
        target: [
          mockExamAttemptAnswers.attemptId,
          mockExamAttemptAnswers.questionId,
        ],
        set: { userAnswer: a.userAnswer },
      })
  }

  return { saved: valid.length }
}

// POST /api/mock-exam-attempts/[attemptId]/submit — atomic, server-authoritative
// scoring. `null` → 404; throws ExamAlreadySubmittedError (with stored result) →
// 409. Scores ALL exam questions (unanswered = incorrect).
export async function submitAttempt(
  userId: string,
  attemptId: string,
  answers: ExamAnswerInput[] = [],
): Promise<SubmitResult | null> {
  return db.transaction(async (tx) => {
    // FOR UPDATE serializes concurrent submits → the second sees 'submitted'.
    const [attempt] = await tx
      .select()
      .from(mockExamAttempts)
      .where(
        and(
          eq(mockExamAttempts.id, attemptId),
          eq(mockExamAttempts.userId, userId),
        ),
      )
      .for('update')
      .limit(1)

    if (!attempt) return null

    if (attempt.status === 'submitted') {
      throw new ExamAlreadySubmittedError({
        scoreTotal: attempt.scoreTotal ?? 0,
        scoreMax: attempt.scoreMax ?? 0,
        percentage: percentage(attempt.scoreTotal ?? 0, attempt.scoreMax ?? 0),
      })
    }

    // The answer key, read server-side only.
    const questions = await tx
      .select({
        id: mockExamQuestions.id,
        correctAnswer: mockExamQuestions.correctAnswer,
      })
      .from(mockExamQuestions)
      .where(eq(mockExamQuestions.examId, attempt.examId))
    const correctById = new Map(questions.map((q) => [q.id, q.correctAnswer]))

    // Persist the final answers (drop any foreign questionId), computing the
    // authoritative isCorrect against the key.
    for (const a of answers) {
      const correct = correctById.get(a.questionId)
      if (correct === undefined) continue
      const isCorrect = correct === a.userAnswer
      await tx
        .insert(mockExamAttemptAnswers)
        .values({
          attemptId,
          questionId: a.questionId,
          userAnswer: a.userAnswer,
          isCorrect,
        })
        .onConflictDoUpdate({
          target: [
            mockExamAttemptAnswers.attemptId,
            mockExamAttemptAnswers.questionId,
          ],
          set: { userAnswer: a.userAnswer, isCorrect },
        })
    }

    // Re-score from the persisted answers (covers answers saved via prior PATCH).
    const saved = await tx
      .select({
        questionId: mockExamAttemptAnswers.questionId,
        userAnswer: mockExamAttemptAnswers.userAnswer,
      })
      .from(mockExamAttemptAnswers)
      .where(eq(mockExamAttemptAnswers.attemptId, attemptId))
    const answerById = new Map(saved.map((a) => [a.questionId, a.userAnswer]))

    const scoreMax = questions.length
    let scoreTotal = 0
    for (const q of questions) {
      if (answerById.get(q.id) === q.correctAnswer) scoreTotal += 1
    }

    await tx
      .update(mockExamAttempts)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        scoreTotal,
        scoreMax,
      })
      .where(eq(mockExamAttempts.id, attemptId))

    return { scoreTotal, scoreMax, percentage: percentage(scoreTotal, scoreMax) }
  })
}

// GET /api/mock-exam-attempts/[attemptId]/review — full results with the answer
// key, own attempt only. `null` → 404 (also masks not-owned); throws
// AttemptNotSubmittedError → 409 when still in progress. Three queries, no N+1.
export async function getAttemptReview(
  userId: string,
  attemptId: string,
): Promise<ExamReviewResponse | null> {
  const [attempt] = await db
    .select({
      id: mockExamAttempts.id,
      examId: mockExamAttempts.examId,
      status: mockExamAttempts.status,
      submittedAt: mockExamAttempts.submittedAt,
      scoreTotal: mockExamAttempts.scoreTotal,
      scoreMax: mockExamAttempts.scoreMax,
      examTitle: mockExams.title,
    })
    .from(mockExamAttempts)
    .innerJoin(mockExams, eq(mockExams.id, mockExamAttempts.examId))
    .where(
      and(
        eq(mockExamAttempts.id, attemptId),
        eq(mockExamAttempts.userId, userId),
      ),
    )
    .limit(1)

  if (!attempt) return null
  if (attempt.status !== 'submitted') throw new AttemptNotSubmittedError()

  // Full columns are safe now: the attempt is submitted and owned.
  const questionRows = await db
    .select({
      id: mockExamQuestions.id,
      sectionName: mockExamQuestions.sectionName,
      prompt: mockExamQuestions.prompt,
      choices: mockExamQuestions.choices,
      correctAnswer: mockExamQuestions.correctAnswer,
      explanation: mockExamQuestions.explanation,
    })
    .from(mockExamQuestions)
    .where(eq(mockExamQuestions.examId, attempt.examId))
    .orderBy(asc(mockExamQuestions.sortOrder))

  const answerRows = await db
    .select({
      questionId: mockExamAttemptAnswers.questionId,
      userAnswer: mockExamAttemptAnswers.userAnswer,
      isCorrect: mockExamAttemptAnswers.isCorrect,
    })
    .from(mockExamAttemptAnswers)
    .where(eq(mockExamAttemptAnswers.attemptId, attemptId))
  const answerByQuestion = new Map(answerRows.map((a) => [a.questionId, a]))

  const questions: ExamReviewQuestion[] = questionRows.map((q) => {
    const answer = answerByQuestion.get(q.id)
    return {
      id: q.id,
      sectionName: q.sectionName,
      prompt: q.prompt,
      choices: parseChoices(q.choices),
      userAnswer: answer?.userAnswer ?? null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      isCorrect: answer?.isCorrect ?? false,
    }
  })

  // Per-section tallies from the persisted, authoritative isCorrect flags.
  const bySection = new Map<string, { scoreTotal: number; scoreMax: number }>()
  for (const q of questions) {
    const tally = bySection.get(q.sectionName) ?? { scoreTotal: 0, scoreMax: 0 }
    tally.scoreMax += 1
    if (q.isCorrect) tally.scoreTotal += 1
    bySection.set(q.sectionName, tally)
  }

  const sections: ExamReviewSectionScore[] = Array.from(bySection.entries())
    .map(([sectionName, t]) => ({
      sectionName,
      scoreTotal: t.scoreTotal,
      scoreMax: t.scoreMax,
      percentage: percentage(t.scoreTotal, t.scoreMax),
    }))
    .sort((a, b) => sectionRank(a.sectionName) - sectionRank(b.sectionName))

  const scoreTotal = attempt.scoreTotal ?? 0
  const scoreMax = attempt.scoreMax ?? 0

  return examReviewResponseSchema.parse({
    attempt: {
      id: attempt.id,
      examId: attempt.examId,
      status: attempt.status,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      scoreTotal,
      scoreMax,
      percentage: percentage(scoreTotal, scoreMax),
    },
    exam: { id: attempt.examId, title: attempt.examTitle },
    sections,
    questions,
  })
}
