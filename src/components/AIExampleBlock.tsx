'use client'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  GenerateExampleError,
  useGenerateExample,
  type GenerateExampleType,
} from '@/hooks/use-generate-example'
import type { GeneratedExample } from '@/services/ai.service'

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

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">AI example sentences</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generate.isPending}
        >
          {generate.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Generating…
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>

      {examples.length > 0 ? (
        <ul className="space-y-3">
          {examples.map((example) => (
            <li key={example.id} className="space-y-1 rounded-lg border p-4">
              <p className="text-base" lang="ja">
                {example.sentenceJa}
              </p>
              {example.sentenceReading ? (
                <p className="text-sm text-muted-foreground" lang="ja">
                  {example.sentenceReading}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {example.sentenceTranslationEn}
              </p>
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
