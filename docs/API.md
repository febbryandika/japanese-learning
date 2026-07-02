# API Reference

All endpoints are Next.js Route Handlers under `src/app/api`. Every route requires an authenticated session **except** `/api/auth/*`, returning `401 { error: "Unauthorized" }` otherwise. Admin routes additionally require the `admin` role (`403` otherwise). Invalid query/body params return `400 { error: "Invalid query parameters" }` (Zod-validated). Learners only ever see their own progress/bookmarks/attempts.

List responses share the shape:

```jsonc
{ "data": [ ...items ], "pagination": { "page": 1, "pageSize": 24, "total": 0, "totalPages": 1 }, /* + optional metadata */ }
```

## Auth (Better Auth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-in/email` | Log in |
| POST | `/api/auth/sign-up/email` | Register (auto-signs-in) |
| POST | `/api/auth/sign-out` | Log out |
| GET | `/api/auth/session` | Current session |

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Progress %, recent activity, weak areas |

## Search

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search` | Cross-resource search |

Query params: `q`, `type` (`kanji\|vocabulary\|grammar\|video`), `jlptLevel`, `progressState`, `bookmarked` (`true`/`false`), `page`, `pageSize`. **No `type`** → grouped preview across all applicable types (`{ type: null, groups: [{ type, items, total }], pagination: null }`); a JLPT filter excludes videos. **With `type`** → paginated single-type results (`{ type, groups: [group], pagination }`).

## Videos

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lesson-groups` | Published groups (with lesson counts) |
| GET | `/api/videos?groupId=...` | Lessons for a group |
| GET | `/api/videos/[id]` | Lesson detail + embed URL |
| PATCH | `/api/videos/[id]/progress` | Update progress state |
| POST | `/api/videos/[id]/bookmark` | Toggle bookmark |

## Kanji / Vocabulary / Grammar

Each resource exposes the same shape (`kanji`, `vocabulary`, `grammar`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/{resource}` | List — filters below |
| GET | `/api/{resource}/[id]` | Detail + AI examples + caller's bookmark/progress |
| PATCH | `/api/{resource}/[id]/progress` | Update mastery (`unseen\|reviewing\|mastered`) |
| POST | `/api/{resource}/[id]/bookmark` | Toggle bookmark |
| POST | `/api/{resource}/[id]/generate-example` | Generate an AI example (201) |

List query params: `q`, `page`, `pageSize`, `progressState`, `bookmarked`, plus a resource-specific filter — kanji `strokeCount`, vocabulary `partOfSpeech`, grammar `jlptLevel`. Kanji/grammar list responses also include `strokeCounts` / `jlptLevels` metadata for the filter dropdowns.

## Mock Exams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mock-exams` | Published exams |
| GET | `/api/mock-exams/[id]` | Exam detail |
| POST | `/api/mock-exams/[id]/attempts` | Start an attempt |
| GET | `/api/mock-exam-attempts/[attemptId]` | Attempt state (own only) |
| PATCH | `/api/mock-exam-attempts/[attemptId]` | Save in-progress answers |
| POST | `/api/mock-exam-attempts/[attemptId]/submit` | Submit + score (transactional) |
| GET | `/api/mock-exam-attempts/[attemptId]/review` | Results with the answer key |

Submit body `{ answers: [{ questionId, userAnswer }] }`; the server re-scores from the DB and never trusts a client-supplied `isCorrect`.

## Reader & lookup

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reader/books` | Book library |
| GET | `/api/reader/books/[bookId]` | Book metadata + file URL |
| PATCH | `/api/reader/books/[bookId]/progress` | Save reading position (CFI) |
| GET | `/api/lookup?q=...` | Word/kanji lookup (≤3 vocabulary + ≤3 kanji) |

## Shared

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookmarks?type=...` | The caller's bookmarks |
| GET | `/api/progress?type=...&state=...` | The caller's tracked progress |

## Admin (role: admin)

CRUD under `/api/admin/*` for lesson groups, videos, kanji, vocabulary, grammar, mock exams (+ questions), and reader books (epub upload/delete). Each accepts `q` + `page`/`pageSize` on its list route and Zod-validated bodies on create/update.
