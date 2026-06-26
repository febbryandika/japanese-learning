'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createGrammarSchema,
  JLPT_LEVELS,
  type CreateGrammarFormValues,
  type CreateGrammarInput,
} from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const jlptItems = Object.fromEntries(JLPT_LEVELS.map((level) => [level, level]))

// Blank optional text field → null clears the column (merge-patch).
const clearable = { setValueAs: (v: string) => (v === '' ? null : v) }

export function GrammarForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<CreateGrammarInput>
  onSubmit: (values: CreateGrammarInput) => void
  submitting: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateGrammarFormValues, unknown, CreateGrammarInput>({
    resolver: zodResolver(createGrammarSchema),
    defaultValues: {
      pattern: defaultValues?.pattern ?? '',
      meaning: defaultValues?.meaning ?? '',
      formation: defaultValues?.formation ?? undefined,
      usageNotes: defaultValues?.usageNotes ?? undefined,
      commonMistakes: defaultValues?.commonMistakes ?? undefined,
      jlptLevel: defaultValues?.jlptLevel ?? 'N2',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="g-pattern">Pattern</Label>
        <Input
          id="g-pattern"
          aria-invalid={Boolean(errors.pattern)}
          {...register('pattern')}
        />
        {errors.pattern ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.pattern.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="g-meaning">Meaning</Label>
        <Input
          id="g-meaning"
          aria-invalid={Boolean(errors.meaning)}
          {...register('meaning')}
        />
        {errors.meaning ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.meaning.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="g-formation">Formation</Label>
        <Textarea id="g-formation" rows={2} {...register('formation', clearable)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="g-usage">Usage notes</Label>
        <Textarea id="g-usage" rows={3} {...register('usageNotes', clearable)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="g-mistakes">Common mistakes</Label>
        <Textarea
          id="g-mistakes"
          rows={2}
          {...register('commonMistakes', clearable)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="g-jlpt">JLPT level</Label>
        <Controller
          name="jlptLevel"
          control={control}
          render={({ field }) => (
            <Select
              items={jlptItems}
              value={field.value ?? 'N2'}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="g-jlpt" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JLPT_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
