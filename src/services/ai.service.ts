import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db'
import { generatedExampleSentences } from '@/lib/db/schema'

export type GeneratedExampleSourceType = 'kanji' | 'vocabulary' | 'grammar'

const MODEL_NAME = 'gpt-4o-mini'
const PROMPT_VERSION = 'v1'

// The model is forced to return exactly this shape (SPEC §5.9 / §10).
// snake_case because it is the LLM-facing contract; DB columns are camelCase.
export const exampleOutputSchema = z.object({
  sentence_ja: z.string().min(1),
  sentence_reading: z.string().optional(),
  sentence_translation_en: z.string().min(1),
})

// Per-resource prompt builders (SPEC §10). Each targets JLPT N2 and instructs the
// model to keep the target word / kanji / pattern clearly visible.
const prompts: Record<
  GeneratedExampleSourceType,
  (subject: string, meaning: string) => string
> = {
  vocabulary: (word, meaning) =>
    `Generate a natural Japanese example sentence using the word "${word}" (${meaning}).
     JLPT N2 difficulty. The sentence must clearly demonstrate the word's meaning.`,
  kanji: (character, meaning) =>
    `Generate a natural Japanese sentence that prominently uses the kanji "${character}" (${meaning}).
     JLPT N2 difficulty. The kanji must appear clearly in the sentence.`,
  grammar: (pattern, meaning) =>
    `Generate a natural Japanese sentence using the grammar pattern "${pattern}" (${meaning}).
     JLPT N2 difficulty. The pattern must appear clearly in the sentence.`,
}

// The detail API + POST response shape (SPEC §7). `sentenceTranslationEn` is
// always populated on insert (outputSchema requires it), so it is non-null here.
export type GeneratedExample = {
  id: string
  sentenceJa: string
  sentenceReading: string | null
  sentenceTranslationEn: string
  modelName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export type GenerateExampleResponse = GeneratedExample

const exampleColumns = {
  id: generatedExampleSentences.id,
  sentenceJa: generatedExampleSentences.sentenceJa,
  sentenceReading: generatedExampleSentences.sentenceReading,
  sentenceTranslationEn: generatedExampleSentences.sentenceTranslationEn,
  modelName: generatedExampleSentences.modelName,
  status: generatedExampleSentences.status,
  createdAt: generatedExampleSentences.createdAt,
}

// The DB column is nullable (SPEC §6) but a row is only ever written with a
// validated translation, so map a (never-occurring) null to '' to keep the
// public type non-null.
function toGeneratedExample(row: {
  id: string
  sentenceJa: string
  sentenceReading: string | null
  sentenceTranslationEn: string | null
  modelName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}): GeneratedExample {
  return { ...row, sentenceTranslationEn: row.sentenceTranslationEn ?? '' }
}

// Calls the model for a structured example, persists it (status `pending`), and
// returns the saved row. Throws if the model output fails schema validation
// (generateObject) or the insert fails — the route maps that to a 502.
export async function generateExample(
  sourceType: GeneratedExampleSourceType,
  sourceId: string,
  promptArgs: { subject: string; meaning: string },
): Promise<GeneratedExample> {
  const prompt = prompts[sourceType](promptArgs.subject, promptArgs.meaning)

  const { object } = await generateObject({
    model: openai(MODEL_NAME),
    schema: exampleOutputSchema,
    prompt,
    // `sentence_reading` is optional (SPEC §5.9). OpenAI's strict structured-output
    // mode — the provider default — requires every property, which rejects optional
    // fields, so relax it here. Keeps the spec-mandated schema intact.
    providerOptions: { openai: { strictJsonSchema: false } },
  })

  const [saved] = await db
    .insert(generatedExampleSentences)
    .values({
      sourceType,
      sourceId,
      modelName: MODEL_NAME,
      promptVersion: PROMPT_VERSION,
      sentenceJa: object.sentence_ja,
      sentenceReading: object.sentence_reading ?? null,
      sentenceTranslationEn: object.sentence_translation_en,
      status: 'pending',
    })
    .returning(exampleColumns)

  return toGeneratedExample(saved)
}

// All saved examples for a study item, newest first (SPEC §7 detail payload).
export async function getGeneratedExamples(
  sourceType: GeneratedExampleSourceType,
  sourceId: string,
): Promise<GeneratedExample[]> {
  const rows = await db
    .select(exampleColumns)
    .from(generatedExampleSentences)
    .where(
      and(
        eq(generatedExampleSentences.sourceType, sourceType),
        eq(generatedExampleSentences.sourceId, sourceId),
      ),
    )
    .orderBy(desc(generatedExampleSentences.createdAt))

  return rows.map(toGeneratedExample)
}
