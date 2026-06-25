'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GenerateExampleResponse } from '@/services/ai.service'

export type GenerateExampleType = 'kanji' | 'vocabulary' | 'grammar'

// Thrown by the generate mutation so callers can tell a rate-limit (429) apart
// from a generic failure and tailor the toast.
export class GenerateExampleError extends Error {
  constructor(public readonly status: number) {
    super(`Generate example failed with status ${status}`)
    this.name = 'GenerateExampleError'
  }
}

// POST /api/{type}/[id]/generate-example, then invalidate the detail query so the
// new example appears in the list (SPEC §8 pattern). One generic hook, re-exported
// from the three resource hooks.
export function useGenerateExample(type: GenerateExampleType) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${type}/${id}/generate-example`, {
        method: 'POST',
      })
      if (!res.ok) {
        throw new GenerateExampleError(res.status)
      }
      return res.json() as Promise<GenerateExampleResponse>
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [type, id] })
    },
  })
}
