# Architecture Diagrams

## System overview

One Next.js 16 deployment serves both the UI and the API. Server Components read
the database directly for initial loads; everything client-driven goes through
Route Handlers via TanStack Query. Both paths share the same Drizzle client.

```mermaid
flowchart LR
    subgraph Browser
        SC["Server-rendered pages<br/>(App Router RSC)"]
        CC["Client components<br/>TanStack Query + Zustand"]
        EPUB["epubjs reader<br/>selection → lookup"]
    end

    subgraph Next["Next.js 16 — single Vercel deployment"]
        PAGES["Pages<br/>src/app/(app), (auth), admin"]
        API["Route Handlers<br/>src/app/api/*"]
        AUTH["Better Auth<br/>sessions + admin/learner RBAC"]
        SVC["Services layer<br/>src/services/*.service.ts"]
        DRIZZLE["Drizzle ORM<br/>src/lib/db"]
    end

    NEON[("Neon PostgreSQL<br/>(serverless)")]
    OPENAI["OpenAI gpt-4o-mini<br/>via Vercel AI SDK"]
    BLOB[("Vercel Blob<br/>epub files")]

    SC --> PAGES
    CC -->|"fetch /api/*"| API
    EPUB -->|"GET /api/lookup?q="| API
    PAGES --> SVC
    API --> AUTH
    API --> SVC
    SVC --> DRIZZLE
    DRIZZLE --> NEON
    SVC -->|"generateObject (Zod schema)"| OPENAI
    API -->|"epub upload / serve"| BLOB
```

## Request flow — a study interaction

What happens when a learner sets a kanji's mastery state:

```mermaid
sequenceDiagram
    participant U as Browser (client component)
    participant RH as Route Handler<br/>PATCH /api/kanji/[id]/progress
    participant BA as Better Auth
    participant S as progress.service
    participant DB as Neon (Drizzle)

    U->>RH: PATCH { progressState: "mastered" }
    RH->>BA: getServerSession()
    BA-->>RH: session (or 401)
    RH->>RH: Zod-validate body
    RH->>S: updateProgress(userId, target, state)
    S->>DB: verify target exists
    S->>DB: upsert study_progress<br/>(unique userId + targetType + targetId)
    DB-->>S: row
    S-->>RH: progress
    RH-->>U: 200 JSON
    U->>U: TanStack Query cache invalidation<br/>→ badge/pill re-renders
```

## Data model (core relationships)

The full schema is documented in [../DATABASE.md](../DATABASE.md). The shape in brief:

```mermaid
erDiagram
    user ||--|| user_profiles : "role (admin/learner)"
    lesson_groups ||--o{ video_lessons : contains
    grammar_items ||--o{ grammar_examples : "curated examples"
    kanji_items ||--o{ generated_example_sentences : "AI examples"
    vocabulary_items ||--o{ generated_example_sentences : "AI examples"
    grammar_items ||--o{ generated_example_sentences : "AI examples"
    mock_exams ||--o{ mock_exam_questions : contains
    mock_exams ||--o{ mock_exam_attempts : "per user"
    mock_exam_attempts ||--o{ mock_exam_attempt_answers : "server-scored"
    epub_books ||--o{ reader_progress : "CFI per user"
    user ||--o{ bookmarks : "polymorphic target"
    user ||--o{ study_progress : "polymorphic target"
```
