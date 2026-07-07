# Database Schema

PostgreSQL (Neon) via Drizzle ORM. Schema source of truth: `src/lib/db/schema.ts`. All primary keys are cuid2 text ids (`createId()`). Better Auth manages its own `user` / `session` / `account` tables; the app extends them with `user_profiles`.

## Enums (stored as text with a checked set)

- **progress_state** (`study_progress.progress_state`): `unseen | in_progress | reviewing | mastered | completed`. Kanji/vocab/grammar use `unseen → reviewing → mastered`; video lessons use `unseen → in_progress → completed`.
- **target_type** (`bookmarks` / `study_progress`): `kanji | vocabulary | grammar | video_lesson`.
- **source_type** (`generated_example_sentences`): `kanji | vocabulary | grammar`.
- **status** (`generated_example_sentences`): `pending | approved | rejected`.
- **attempt status** (`mock_exam_attempts`): `in_progress | submitted`.
- **role** (`user_profiles`): `admin | learner`.
- **status** (`user_profiles`): `active | disabled` (Phase 16). A `disabled` account is rejected at sign-in (`databaseHooks.session.create.before` in `src/lib/auth.ts`).

## Tables

### Auth extension
- **user_profiles** — `userId` (unique, Better Auth user id), `displayName`, `role` (default `learner`), `status` (default `active`), `createdAt`.

### Content
- **lesson_groups** — `slug` (unique), `title`, `sortOrder`, `isPublished`.
- **video_lessons** — FK `lessonGroupId → lesson_groups`, `title`, `description`, `embedUrl`, `durationSeconds`, `sortOrder`, `isPublished`. Index: `(lessonGroupId, sortOrder)`.
- **kanji_items** — `character` (unique), `onyomi`, `kunyomi`, `meaning`, `strokeCount`, `jlptLevel`, `notes` (JSON-stringified compound list). Index: `character`.
- **vocabulary_items** — `word`, `reading`, `meaning`, `partOfSpeech`, `jlptLevel`, `notes`, `exampleSentenceOriginal`, `exampleSentenceTranslation`. Indexes: `word`, `reading`.
- **grammar_items** — `pattern`, `meaning`, `formation`, `usageNotes`, `commonMistakes`, `jlptLevel`. Index: `pattern`.
- **grammar_examples** — FK `grammarId → grammar_items` (cascade delete), `sentenceJa`, `sentenceEn`, `orderIndex`. Index: `grammarId`. Joined one-to-many on the grammar detail page.

### AI
- **generated_example_sentences** — `sourceType`, `sourceId`, `promptVersion`, `modelName`, `sentenceJa`, `sentenceReading`, `sentenceTranslationEn`, `status` (default `pending`). Index: `(sourceType, sourceId)`.

### Mock exams
- **mock_exams** — `title`, `description`, `timeLimitMinutes` (default 90), `isPublished`.
- **mock_exam_questions** — FK `examId → mock_exams` (cascade), `sectionName`, `prompt`, `choices` (JSON `string[]`), `correctAnswer`, `explanation`, `sortOrder`. Index: `examId`.
- **mock_exam_attempts** — `userId`, FK `examId → mock_exams`, `startedAt`, `submittedAt`, `scoreTotal`, `scoreMax`, `status`. Index: `(userId, examId)`.
- **mock_exam_attempt_answers** — FK `attemptId → mock_exam_attempts` (cascade), FK `questionId → mock_exam_questions`, `userAnswer`, `isCorrect`. Unique: `(attemptId, questionId)`.

### Reader
- **epub_books** — `title`, `author`, `fileUrl` (Vercel Blob or `/public`), `coverUrl`, `isPublished`.
- **reader_progress** — `userId`, FK `bookId → epub_books` (cascade), `cfi` (epubjs position), `updatedAt`. Unique: `(userId, bookId)`.

### Per-user state
- **bookmarks** — `userId`, `targetType`, `targetId`, `createdAt`. Unique: `(userId, targetType, targetId)`. Index: `(userId, targetType)`.
- **study_progress** — `userId`, `targetType`, `targetId`, `progressState` (default `unseen`), `lastViewedAt`, `completedAt`. Unique: `(userId, targetType, targetId)`. Index: `(userId, targetType)`.

## Notes on indexing & queries

- List/search text matching uses `ilike '%term%'` across the resource's name/reading/meaning columns; the single-column btree indexes above back exact/prefix lookups (e.g. the reader lookup uses exact + `q%` prefix + `IN` on `character`).
- `bookmarks` / `study_progress` are joined per user on every list query to render the caller's mastery/bookmark state. The unique `(userId, targetType, targetId)` constraint keeps those joins 1:1, so they don't multiply rows and are safe inside `count()` queries used for pagination.
- `targetId` on `bookmarks` / `study_progress` is a polymorphic reference (no FK); services validate the target exists before writing progress/bookmarks.
