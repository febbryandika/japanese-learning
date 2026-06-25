import { z } from 'zod'

// Better Auth's default minimum password length is 8.
const password = z.string().min(8, 'Password must be at least 8 characters')

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password,
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.email('Enter a valid email address'),
  password,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

// ─── Videos ─────────────────────────────────────────────────────────────────

// Video lessons use the subset of the shared progress_state enum. `unseen` is
// the "not started" state (the DB has no `not_started` value). The array drives
// both the PATCH schema and the video ProgressSelector options.
export const VIDEO_PROGRESS_STATES = ['unseen', 'in_progress', 'completed'] as const

export const updateVideoProgressSchema = z.object({
  progressState: z.enum(VIDEO_PROGRESS_STATES),
})

export const videoListQuerySchema = z.object({
  groupId: z.string().min(1, 'groupId is required'),
})

export type UpdateVideoProgressInput = z.infer<typeof updateVideoProgressSchema>
export type VideoProgressState = UpdateVideoProgressInput['progressState']

// The full shared progress_state enum (SPEC §6). ProgressBadge renders any of
// these; videos only ever use the VideoProgressState subset.
export type ProgressState =
  | 'unseen'
  | 'in_progress'
  | 'reviewing'
  | 'mastered'
  | 'completed'

// ─── Kanji ────────────────────────────────────────────────────────────────────

// `q` matches across character / onyomi / kunyomi / meaning (server-side ILIKE).
// `strokeCount` is an optional exact filter. `page` / `pageSize` drive
// server-side pagination; coerced from string query params and bounded so a
// response can never request an unbounded page.
export const kanjiListQuerySchema = z.object({
  q: z.string().trim().optional(),
  strokeCount: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
})

export type KanjiListQuery = z.infer<typeof kanjiListQuerySchema>

// `kanji_items.notes` holds a JSON-stringified array of compound words. Parsed
// defensively (see kanji.service) so malformed data degrades to an empty list.
export const kanjiCompoundSchema = z.array(
  z.object({
    word: z.string(),
    reading: z.string(),
    meaning: z.string(),
  }),
)

export type KanjiCompound = z.infer<typeof kanjiCompoundSchema>[number]

// ─── Vocabulary ─────────────────────────────────────────────────────────────

// The fixed N2 part-of-speech set (SPEC §9). Single source of truth for both the
// query enum below and the filter dropdown labels, so the two never drift.
export const VOCAB_PARTS_OF_SPEECH = [
  'noun',
  'verb',
  'i-adjective',
  'na-adjective',
  'adverb',
  'katakana',
  'conjunction',
  'prefix',
  'suffix',
  'idiom',
] as const

export type VocabPartOfSpeech = (typeof VOCAB_PARTS_OF_SPEECH)[number]

export const VOCAB_POS_LABELS: Record<VocabPartOfSpeech, string> = {
  noun: 'Noun',
  verb: 'Verb',
  'i-adjective': 'i-Adjective',
  'na-adjective': 'na-Adjective',
  adverb: 'Adverb',
  katakana: 'Katakana',
  conjunction: 'Conjunction',
  prefix: 'Prefix',
  suffix: 'Suffix',
  idiom: 'Idiom',
}

// `q` matches across word / reading / meaning (server-side ILIKE).
// `partOfSpeech` is an optional exact filter. `page` / `pageSize` drive
// server-side pagination; coerced from string query params and bounded so a
// response can never request an unbounded page.
export const vocabularyListQuerySchema = z.object({
  q: z.string().trim().optional(),
  partOfSpeech: z.enum(VOCAB_PARTS_OF_SPEECH).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
})

export type VocabularyListQuery = z.infer<typeof vocabularyListQuerySchema>

// ─── Grammar ──────────────────────────────────────────────────────────────────

// The JLPT level set (SPEC §9). Drives the grammar filter dropdown's accepted
// values; the actual options offered are derived from the data (see
// grammar.service `getJlptLevelOptions`) so the UI never offers an empty level.
export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const

export type JlptLevel = (typeof JLPT_LEVELS)[number]

// `q` matches across pattern / meaning (server-side ILIKE). `jlptLevel` is an
// optional exact filter. `page` / `pageSize` drive server-side pagination;
// coerced from string query params and bounded so a response can never request
// an unbounded page.
export const grammarListQuerySchema = z.object({
  q: z.string().trim().optional(),
  jlptLevel: z.enum(JLPT_LEVELS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
})

export type GrammarListQuery = z.infer<typeof grammarListQuerySchema>

// ─── Bookmarks ────────────────────────────────────────────────────────────────

// The four bookmarkable resource types (matches the `bookmarks.target_type`
// enum, SPEC §6). Single source of truth for the query enum and the filter UI.
export const BOOKMARK_TARGET_TYPES = [
  'kanji',
  'vocabulary',
  'grammar',
  'video_lesson',
] as const

export type BookmarkTargetType = (typeof BOOKMARK_TARGET_TYPES)[number]

// The POST toggle routes carry `targetType` in the path and `targetId` as the
// `[id]` param — there is no request body. This enum guards the targetType at
// the service boundary; existence of the target row is checked there too.
export const bookmarkTargetTypeSchema = z.enum(BOOKMARK_TARGET_TYPES)

// `type` optionally narrows the bookmarks list to one resource type.
export const bookmarksListQuerySchema = z.object({
  type: z.enum(BOOKMARK_TARGET_TYPES).optional(),
})

export type BookmarksListQuery = z.infer<typeof bookmarksListQuerySchema>

// ─── Progress ─────────────────────────────────────────────────────────────────

// All five progress states (the shared progress_state enum, SPEC §6). Drives the
// progress page's state filter and the GET /api/progress query schema.
export const PROGRESS_STATES = [
  'unseen',
  'in_progress',
  'reviewing',
  'mastered',
  'completed',
] as const

// Kanji / vocabulary / grammar mastery uses this three-value subset
// (`unseen → reviewing → mastered`); videos use VIDEO_PROGRESS_STATES.
export const STUDY_PROGRESS_STATES = ['unseen', 'reviewing', 'mastered'] as const

export type StudyProgressState = (typeof STUDY_PROGRESS_STATES)[number]

// PATCH /api/{kanji,vocabulary,grammar}/[id]/progress. Deliberately narrower than
// the shared enum: a kanji can't be set to `in_progress`/`completed`.
export const updateStudyProgressSchema = z.object({
  progressState: z.enum(STUDY_PROGRESS_STATES),
})

export type UpdateStudyProgressInput = z.infer<typeof updateStudyProgressSchema>

// GET /api/progress filters: optional resource type + optional progress state.
export const progressListQuerySchema = z.object({
  type: z.enum(BOOKMARK_TARGET_TYPES).optional(),
  state: z.enum(PROGRESS_STATES).optional(),
})

export type ProgressListQuery = z.infer<typeof progressListQuerySchema>

// ─── Dashboard ──────────────────────────────────────────────────────────────

// Per-resource progress for the dashboard summary cards. `percentage` is the
// rounded `mastered / total` (0–100). The dashboard service validates each
// computed stat against this before returning (GET /api/dashboard).
export const dashboardProgressStatSchema = z.object({
  mastered: z.number().int().min(0),
  total: z.number().int().min(0),
  percentage: z.number().int().min(0).max(100),
})

export type DashboardProgressStat = z.infer<typeof dashboardProgressStatSchema>

// A lowest-scoring exam section for the Weak Areas card. Always empty until the
// Phase 3 mock-exam module exists; the schema is here so the computation can
// drop in without a contract change.
export const dashboardWeakAreaSchema = z.object({
  sectionName: z.string(),
  correct: z.number().int().min(0),
  total: z.number().int().min(0),
  percentage: z.number().int().min(0).max(100),
})

export type DashboardWeakArea = z.infer<typeof dashboardWeakAreaSchema>

// ─── Mock Exams ───────────────────────────────────────────────────────────────

// The four JLPT mock-exam sections (SPEC §5.7). Single source of truth for the
// detail page's section grouping and the seed data's allowed section names.
export const EXAM_SECTIONS = ['文法', '語彙', '読解', '聴解'] as const

export type ExamSection = (typeof EXAM_SECTIONS)[number]

// A single answer to one question. Ids are validated as non-empty strings and
// their existence is checked in the service (matching the codebase convention —
// no .cuid2()). userAnswer must match one of the question's stored choices.
export const examAnswerSchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.string().min(1),
})

// PATCH /api/mock-exam-attempts/[attemptId] — periodic / on-navigation save of
// in-progress answers. The array may be empty (clearing / a no-op autosave).
export const saveExamAnswersSchema = z.object({
  answers: z.array(examAnswerSchema),
})

// POST /api/mock-exam-attempts/[attemptId]/submit. `answers` is optional and may
// be empty: auto-submit at time 0 can carry zero answers, and answers are already
// persisted via PATCH. The server re-scores from the DB (never trusts the client).
export const submitExamSchema = z.object({
  answers: z.array(examAnswerSchema).optional().default([]),
})

export type ExamAnswerInput = z.infer<typeof examAnswerSchema>
export type SaveExamAnswersInput = z.infer<typeof saveExamAnswersSchema>
export type SubmitExamInput = z.infer<typeof submitExamSchema>

// ─── Exam Review (GET /api/mock-exam-attempts/[attemptId]/review) ──────────────
// The review exposes the answer key, so it is only ever built for a submitted
// attempt owned by the requester. The service validates the computed payload
// against these schemas before returning (same convention as the dashboard).

// One reviewed question: the user's choice alongside the correct one. `userAnswer`
// is null when the question was left unanswered; `correctAnswer`/`explanation`
// are safe to send only because the attempt is already submitted.
export const examReviewQuestionSchema = z.object({
  id: z.string(),
  sectionName: z.string(),
  prompt: z.string(),
  choices: z.array(z.string()),
  userAnswer: z.string().nullable(),
  correctAnswer: z.string(),
  explanation: z.string().nullable(),
  isCorrect: z.boolean(),
})

// Per-section tally for the score breakdown card.
export const examReviewSectionScoreSchema = z.object({
  sectionName: z.string(),
  scoreTotal: z.number().int().min(0),
  scoreMax: z.number().int().min(0),
  percentage: z.number().int().min(0).max(100),
})

// `submittedAt` is an ISO string (Date serialized over JSON).
export const examReviewResponseSchema = z.object({
  attempt: z.object({
    id: z.string(),
    examId: z.string(),
    status: z.literal('submitted'),
    submittedAt: z.string().nullable(),
    scoreTotal: z.number().int().min(0),
    scoreMax: z.number().int().min(0),
    percentage: z.number().int().min(0).max(100),
  }),
  exam: z.object({
    id: z.string(),
    title: z.string(),
  }),
  sections: z.array(examReviewSectionScoreSchema),
  questions: z.array(examReviewQuestionSchema),
})

export type ExamReviewQuestion = z.infer<typeof examReviewQuestionSchema>
export type ExamReviewSectionScore = z.infer<typeof examReviewSectionScoreSchema>
export type ExamReviewResponse = z.infer<typeof examReviewResponseSchema>

// ─── Reader ─────────────────────────────────────────────────────────────────

// PATCH /api/reader/books/[bookId]/progress — save the epubjs CFI for the
// current reading position. `cfi` is an opaque epubjs string (existence of the
// book is checked in the service); a non-empty value is all we validate here.
export const updateReaderProgressSchema = z.object({
  cfi: z.string().min(1),
})

export type UpdateReaderProgressInput = z.infer<typeof updateReaderProgressSchema>
