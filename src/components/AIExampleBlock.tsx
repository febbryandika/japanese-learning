'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  GenerateExampleError,
  useGenerateExample,
  type GenerateExampleType,
} from '@/hooks/use-generate-example'
import type { GeneratedExample } from '@/services/ai.service'

// Sumi Night AI card: subtle indigo gradient surface with a sparkle header and
// the model name, sentences with a brand left border. "Generate" appends a new
// example (rate-limited server-side).
export function AIExampleBlock({
  targetType,
  targetId,
  examples,
}: {
  targetType: GenerateExampleType
  targetId: string
  examples: GeneratedExample[]
}) {
  const generate = useGenerateExample(targetType)

  const handleGenerate = () => {
    generate.mutate(targetId, {
      onError: (error) => {
        const rateLimited =
          error instanceof GenerateExampleError && error.status === 429
        toast.error(
          rateLimited
            ? "You're generating too fast — try again in a minute."
            : 'Could not generate an example. Please try again.',
        )
      },
    })
  }

  const modelName = examples[0]?.modelName ?? 'gpt-4o-mini'

  return (
    <section className="rounded-2xl border bg-card p-[22px] dark:bg-[linear-gradient(160deg,oklch(0.24_0.05_285),oklch(0.2_0.04_265))]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <h2 className="text-[13px] font-semibold text-primary">
          AI example sentences
        </h2>
        <span className="ml-auto text-[11px] text-muted-foreground">{modelName}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-[10px]"
          onClick={handleGenerate}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Generating…
            </>
          ) : examples.length > 0 ? (
            'Regenerate'
          ) : (
            'Generate'
          )}
        </Button>
      </div>

      {examples.length > 0 ? (
        <ul className="space-y-4">
          {examples.map((example) => (
            <li key={example.id} className="border-l-2 border-primary pl-3.5">
              <p className="jp text-[17px] leading-relaxed" lang="ja">
                {example.sentenceJa}
              </p>
              {example.sentenceReading ? (
                <p className="jps mt-0.5 text-[12.5px] text-muted-foreground" lang="ja">
                  {example.sentenceReading}
                </p>
              ) : null}
              <p className="mt-1 text-[13px]">{example.sentenceTranslationEn}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No AI examples yet. Click Generate to create one.
        </p>
      )}
    </section>
  )
}
