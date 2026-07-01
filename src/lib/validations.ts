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

// ─── Lookup ───────────────────────────────────────────────────────────────────

// GET /api/lookup?q=… — reader word lookup. `q` is the selected text (already
// trimmed client-side); we trim again and cap the length so a stray long
// selection can't drive an oversized query.
export const lookupQuerySchema = z.object({
  q: z.string().trim().min(1).max(64),
})

export type LookupQuery = z.infer<typeof lookupQuerySchema>

// ─── Search (SPEC §5.10) ────────────────────────────────────────────────────────

// The four searchable resource types. `video` maps to published video lessons;
// the other three are the study resources. Single source of truth for the query
// enum and the search page's type filter.
export const SEARCH_TYPES = ['kanji', 'vocabulary', 'grammar', 'video'] as const

export type SearchType = (typeof SEARCH_TYPES)[number]

// GET /api/search. `type` omitted → grouped preview across all applicable types;
// `type` set → paginated single-type results. Filters mirror SPEC §5.10 (resource
// type, mastery state, bookmarked-only, JLPT level). `jlptLevel` excludes videos
// (no JLPT column). `bookmarked` is a string query param, so it's parsed from the
// literal 'true'/'false' rather than coerced (z.coerce.boolean treats 'false' as
// true). page/pageSize drive single-type paging, bounded like the list schemas.
export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(SEARCH_TYPES).optional(),
  jlptLevel: z.enum(JLPT_LEVELS).optional(),
  progressState: z.enum(PROGRESS_STATES).optional(),
  bookmarked: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>

// ─── Admin (Phase 5) ──────────────────────────────────────────────────────────

// Shared query for every admin list route: free-text search + bounded paging.
// Unlike the learner list schemas, admin lists never filter by publish state.
export const adminListQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type AdminListQuery = z.infer<typeof adminListQuerySchema>

// Update schemas are authored as their own all-optional objects (no defaults) so
// a PATCH that omits a field leaves it unchanged — `.partial()` of a schema with
// `.default()` would silently reset omitted fields.

// Lesson groups. `slug` is unique (DB) and URL-safe.
export const createLessonGroupSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  title: z.string().min(1).max(200),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
})

export const updateLessonGroupSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only')
    .optional(),
  title: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

export type CreateLessonGroupInput = z.infer<typeof createLessonGroupSchema>
export type UpdateLessonGroupInput = z.infer<typeof updateLessonGroupSchema>
// Pre-default (input) shape — used as the react-hook-form field-values type so a
// defaulted field can be omitted from the form's initial values.
export type CreateLessonGroupFormValues = z.input<typeof createLessonGroupSchema>

// Video lessons. `lessonGroupId` references an existing group (FK enforced in DB).
// Optional fields are nullable (`.nullish()`): a blank form field sends `null` to
// clear the column, while omitting it leaves the value unchanged (RFC 7396 merge
// patch). Applies to create too so the form's clear→null mapping is uniform.
export const createVideoSchema = z.object({
  lessonGroupId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  embedUrl: z.url().nullish(),
  durationSeconds: z.number().int().min(0).max(86_400).nullish(),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
})

export const updateVideoSchema = z.object({
  lessonGroupId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  embedUrl: z.url().nullish(),
  durationSeconds: z.number().int().min(0).max(86_400).nullish(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

export type CreateVideoInput = z.infer<typeof createVideoSchema>
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>
export type CreateVideoFormValues = z.input<typeof createVideoSchema>

// Kanji (SPEC §9). `character` is unique (DB). Nullable optionals use `.nullish()`
// so a blank form field clears the column (merge-patch). `notes` holds a
// JSON-stringified compound list — capped well above SPEC's 1000 to fit real seed
// data (a kanji can have many compounds).
export const createKanjiSchema = z.object({
  character: z.string().length(1),
  onyomi: z.string().max(200).nullish(),
  kunyomi: z.string().max(200).nullish(),
  meaning: z.string().min(1).max(300),
  strokeCount: z.number().int().min(1).max(30).nullish(),
  jlptLevel: z.enum(JLPT_LEVELS).default('N2'),
  notes: z.string().max(8000).nullish(),
})

export const updateKanjiSchema = z.object({
  character: z.string().length(1).optional(),
  onyomi: z.string().max(200).nullish(),
  kunyomi: z.string().max(200).nullish(),
  meaning: z.string().min(1).max(300).optional(),
  strokeCount: z.number().int().min(1).max(30).nullish(),
  jlptLevel: z.enum(JLPT_LEVELS).optional(),
  notes: z.string().max(8000).nullish(),
})

export type CreateKanjiInput = z.infer<typeof createKanjiSchema>
export type UpdateKanjiInput = z.infer<typeof updateKanjiSchema>
export type CreateKanjiFormValues = z.input<typeof createKanjiSchema>

// Vocabulary (SPEC §9). No unique constraint.
export const createVocabularySchema = z.object({
  word: z.string().min(1).max(100),
  reading: z.string().min(1).max(200),
  meaning: z.string().min(1).max(500),
  partOfSpeech: z.enum(VOCAB_PARTS_OF_SPEECH).nullish(),
  jlptLevel: z.enum(JLPT_LEVELS).default('N2'),
  notes: z.string().max(1000).nullish(),
  exampleSentenceOriginal: z.string().max(500).nullish(),
  exampleSentenceTranslation: z.string().max(500).nullish(),
})

export const updateVocabularySchema = z.object({
  word: z.string().min(1).max(100).optional(),
  reading: z.string().min(1).max(200).optional(),
  meaning: z.string().min(1).max(500).optional(),
  partOfSpeech: z.enum(VOCAB_PARTS_OF_SPEECH).nullish(),
  jlptLevel: z.enum(JLPT_LEVELS).optional(),
  notes: z.string().max(1000).nullish(),
  exampleSentenceOriginal: z.string().max(500).nullish(),
  exampleSentenceTranslation: z.string().max(500).nullish(),
})

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>
export type CreateVocabularyFormValues = z.input<typeof createVocabularySchema>

// Grammar (SPEC §9). No unique constraint; deleting cascades grammar_examples.
export const createGrammarSchema = z.object({
  pattern: z.string().min(1).max(200),
  meaning: z.string().min(1).max(500),
  formation: z.string().max(1000).nullish(),
  usageNotes: z.string().max(2000).nullish(),
  commonMistakes: z.string().max(1000).nullish(),
  jlptLevel: z.enum(JLPT_LEVELS).default('N2'),
})

export const updateGrammarSchema = z.object({
  pattern: z.string().min(1).max(200).optional(),
  meaning: z.string().min(1).max(500).optional(),
  formation: z.string().max(1000).nullish(),
  usageNotes: z.string().max(2000).nullish(),
  commonMistakes: z.string().max(1000).nullish(),
  jlptLevel: z.enum(JLPT_LEVELS).optional(),
})

export type CreateGrammarInput = z.infer<typeof createGrammarSchema>
export type UpdateGrammarInput = z.infer<typeof updateGrammarSchema>
export type CreateGrammarFormValues = z.input<typeof createGrammarSchema>

// Mock exams. `isPublished` gates learner visibility; `description` is clearable.
export const createMockExamSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  timeLimitMinutes: z.number().int().min(1).max(600).default(90),
  isPublished: z.boolean().default(false),
})

export const updateMockExamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  timeLimitMinutes: z.number().int().min(1).max(600).optional(),
  isPublished: z.boolean().optional(),
})

export type CreateMockExamInput = z.infer<typeof createMockExamSchema>
export type UpdateMockExamInput = z.infer<typeof updateMockExamSchema>
export type CreateMockExamFormValues = z.input<typeof createMockExamSchema>

// Exam questions. `choices` is a 2–6 item list; `correctAnswer` must be one of
// them (the answer key is stored as the choice text, matching the seed/scoring).
export const examQuestionSchema = z
  .object({
    sectionName: z.enum(EXAM_SECTIONS),
    prompt: z.string().min(1).max(2000),
    choices: z.array(z.string().min(1).max(500)).min(2).max(6),
    correctAnswer: z.string().min(1),
    explanation: z.string().max(2000).nullish(),
    sortOrder: z.number().int().min(0).default(0),
  })
  .refine((q) => q.choices.includes(q.correctAnswer), {
    message: 'Correct answer must be one of the choices',
    path: ['correctAnswer'],
  })

// `.partial()` strips the refine, so the update schema is authored explicitly and
// re-applies the check only when both fields are present in the patch.
export const updateExamQuestionSchema = z
  .object({
    sectionName: z.enum(EXAM_SECTIONS).optional(),
    prompt: z.string().min(1).max(2000).optional(),
    choices: z.array(z.string().min(1).max(500)).min(2).max(6).optional(),
    correctAnswer: z.string().min(1).optional(),
    explanation: z.string().max(2000).nullish(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(
    (q) =>
      !(q.choices && q.correctAnswer) || q.choices.includes(q.correctAnswer),
    { message: 'Correct answer must be one of the choices', path: ['correctAnswer'] },
  )

export type ExamQuestionInput = z.infer<typeof examQuestionSchema>
export type UpdateExamQuestionInput = z.infer<typeof updateExamQuestionSchema>
export type ExamQuestionFormValues = z.input<typeof examQuestionSchema>

// Epub books. `fileUrl` is the private Vercel Blob URL produced server-side by
// the upload; it is not part of the client request. `author`/`coverUrl` are
// clearable (merge-patch). The file itself isn't changed via metadata update.
export const createBookSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(200).nullish(),
  fileUrl: z.url(),
  coverUrl: z.url().nullish(),
  isPublished: z.boolean().default(false),
})

// Server-side uploads pass through the serverless function, so the EPUB must fit
// under the platform's ~4.5 MB request-body limit (with headroom for the
// multipart envelope). Enforced on both the client and the route.
export const MAX_EPUB_UPLOAD_MB = 4
export const MAX_EPUB_UPLOAD_BYTES = MAX_EPUB_UPLOAD_MB * 1024 * 1024

// The metadata that accompanies a multipart upload (the file is read separately
// from the form). Books are uploaded server-side, so there is no client fileUrl.
export const bookUploadMetadataSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(200).nullish(),
  isPublished: z.boolean(),
})

export type BookUploadMetadata = z.infer<typeof bookUploadMetadataSchema>

export const updateBookSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  author: z.string().max(200).nullish(),
  coverUrl: z.url().nullish(),
  isPublished: z.boolean().optional(),
})

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
