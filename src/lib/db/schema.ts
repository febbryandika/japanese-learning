import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// Better Auth manages its own tables (user / session / account / verification).
// They are generated into ./auth-schema.ts and re-exported here so a single
// migration covers the whole foundation.
export * from './auth-schema'

// App-level extension of the Better Auth user. Holds the role used for RBAC.
// `userId` references the Better Auth user id as plain text (no FK), matching
// the user-scoped table pattern used elsewhere in the spec.
export const userProfiles = pgTable('user_profiles', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique(),
  displayName: text('display_name'),
  role: text('role', { enum: ['admin', 'learner'] })
    .notNull()
    .default('learner'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// ─── Videos ─────────────────────────────────────────────────────────────────

export const lessonGroups = pgTable('lesson_groups', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(), // "文法", "漢字", etc.
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),
})

export const videoLessons = pgTable(
  'video_lessons',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    lessonGroupId: text('lesson_group_id')
      .notNull()
      .references(() => lessonGroups.id),
    title: text('title').notNull(),
    description: text('description'),
    embedUrl: text('embed_url'), // returned from server; raw Drive URL not exposed
    durationSeconds: integer('duration_seconds'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('idx_video_group').on(t.lessonGroupId, t.sortOrder)],
)

// ─── Kanji ──────────────────────────────────────────────────────────────────

export const kanjiItems = pgTable(
  'kanji_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    character: text('character').notNull().unique(), // e.g. "読"
    onyomi: text('onyomi'), // e.g. "ドク・トク"
    kunyomi: text('kunyomi'), // e.g. "よ.む" (null if none)
    meaning: text('meaning').notNull(),
    strokeCount: integer('stroke_count'),
    jlptLevel: text('jlpt_level').notNull().default('N2'),
    notes: text('notes'), // JSON: [{word, reading, meaning}] compound list
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('idx_kanji_character').on(t.character)],
)

// ─── Vocabulary ─────────────────────────────────────────────────────────────

export const vocabularyItems = pgTable(
  'vocabulary_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    word: text('word').notNull(),
    reading: text('reading').notNull(),
    meaning: text('meaning').notNull(),
    partOfSpeech: text('part_of_speech'),
    jlptLevel: text('jlpt_level').notNull().default('N2'),
    notes: text('notes'),
    exampleSentenceOriginal: text('example_sentence_original'),
    exampleSentenceTranslation: text('example_sentence_translation'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('idx_vocab_word').on(t.word),
    index('idx_vocab_reading').on(t.reading),
  ],
)

// ─── Grammar ──────────────────────────────────────────────────────────────────

export const grammarItems = pgTable(
  'grammar_items',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    pattern: text('pattern').notNull(), // e.g. "〜ばかりか"
    meaning: text('meaning').notNull(),
    formation: text('formation'),
    usageNotes: text('usage_notes'),
    commonMistakes: text('common_mistakes'),
    jlptLevel: text('jlpt_level').notNull().default('N2'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('idx_grammar_pattern').on(t.pattern)],
)

// Curated example sentences, one-to-many under a grammar item. Ordered by
// `orderIndex` when rendered. Cascades on grammar deletion.
export const grammarExamples = pgTable(
  'grammar_examples',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    grammarId: text('grammar_id')
      .notNull()
      .references(() => grammarItems.id, { onDelete: 'cascade' }),
    sentenceJa: text('sentence_ja').notNull(),
    sentenceEn: text('sentence_en').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
  },
  (t) => [index('idx_grammar_examples_grammar_id').on(t.grammarId)],
)

// ─── Progress ───────────────────────────────────────────────────────────────
// One shared table across target types. Video lessons use the subset
// `unseen | in_progress | completed`; `unseen` is the shared default.

export const studyProgress = pgTable(
  'study_progress',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    targetType: text('target_type', {
      enum: ['kanji', 'vocabulary', 'grammar', 'video_lesson'],
    }).notNull(),
    targetId: text('target_id').notNull(),
    progressState: text('progress_state', {
      enum: ['unseen', 'in_progress', 'reviewing', 'mastered', 'completed'],
    })
      .notNull()
      .default('unseen'),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    unique('uq_progress').on(t.userId, t.targetType, t.targetId),
    index('idx_progress_user').on(t.userId, t.targetType),
  ],
)

// ─── Bookmarks ──────────────────────────────────────────────────────────────
// One row per (user, target). The unique constraint makes a bookmark a set
// membership — toggling just inserts or deletes. `targetId` has no FK (it spans
// four resource tables), so existence is validated in the service before write.

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    targetType: text('target_type', {
      enum: ['kanji', 'vocabulary', 'grammar', 'video_lesson'],
    }).notNull(),
    targetId: text('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique('uq_bookmark').on(t.userId, t.targetType, t.targetId),
    index('idx_bookmarks_user').on(t.userId, t.targetType),
  ],
)

// ─── Mock Exams ─────────────────────────────────────────────────────────────
// A timed, section-based multiple-choice exam. Questions cascade on exam delete.
// Attempts are per user; answers cascade on attempt delete. Scoring is
// server-authoritative and transactional (see exam.service `submitAttempt`).

export const mockExams = pgTable('mock_exams', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text('title').notNull(),
  description: text('description'),
  timeLimitMinutes: integer('time_limit_minutes').notNull().default(90),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const mockExamQuestions = pgTable(
  'mock_exam_questions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    examId: text('exam_id')
      .notNull()
      .references(() => mockExams.id, { onDelete: 'cascade' }),
    sectionName: text('section_name').notNull(), // "文法", "語彙", "読解", "聴解"
    prompt: text('prompt').notNull(),
    choices: text('choices').notNull(), // JSON: string[]
    correctAnswer: text('correct_answer').notNull(), // server-only; never sent to client
    explanation: text('explanation'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [index('idx_questions_exam').on(t.examId)],
)

export const mockExamAttempts = pgTable(
  'mock_exam_attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id').notNull(),
    examId: text('exam_id')
      .notNull()
      .references(() => mockExams.id),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    scoreTotal: integer('score_total'),
    scoreMax: integer('score_max'),
    status: text('status', { enum: ['in_progress', 'submitted'] })
      .notNull()
      .default('in_progress'),
  },
  (t) => [index('idx_attempts_user').on(t.userId, t.examId)],
)

export const mockExamAttemptAnswers = pgTable(
  'mock_exam_attempt_answers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => mockExamAttempts.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => mockExamQuestions.id),
    userAnswer: text('user_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
  },
  // One answer row per (attempt, question) — lets PATCH/submit upsert via
  // onConflictDoUpdate as the user revises answers.
  (t) => [unique('uq_attempt_answer').on(t.attemptId, t.questionId)],
)
