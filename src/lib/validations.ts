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
// the "not started" state (the DB has no `not_started` value).
export const updateVideoProgressSchema = z.object({
  progressState: z.enum(['unseen', 'in_progress', 'completed']),
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
