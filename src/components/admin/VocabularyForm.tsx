'use client'

import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createVocabularySchema,
  JLPT_LEVELS,
  VOCAB_POS_LABELS,
  type CreateVocabularyFormValues,
  type CreateVocabularyInput,
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

// Sentinel for the "no part of speech" option (base-ui Select values are strings).
const POS_NONE = '__none__'
const posItems = {
  [POS_NONE]: 'None',
  ...VOCAB_POS_LABELS,
}

const clearable = { setValueAs: (v: string) => (v === '' ? null : v) }

export function VocabularyForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<CreateVocabularyInput>
  onSubmit: (values: CreateVocabularyInput) => void
  submitting: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateVocabularyFormValues, unknown, CreateVocabularyInput>({
    resolver: zodResolver(createVocabularySchema),
    defaultValues: {
      word: defaultValues?.word ?? '',
      reading: defaultValues?.reading ?? '',
      meaning: defaultValues?.meaning ?? '',
      partOfSpeech: defaultValues?.partOfSpeech ?? undefined,
      jlptLevel: defaultValues?.jlptLevel ?? 'N2',
      notes: defaultValues?.notes ?? undefined,
      exampleSentenceOriginal: defaultValues?.exampleSentenceOriginal ?? undefined,
      exampleSentenceTranslation:
        defaultValues?.exampleSentenceTranslation ?? undefined,
    },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-h-[70vh] space-y-4 overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="v-word">Word</Label>
          <Input
            id="v-word"
            aria-invalid={Boolean(errors.word)}
            {...register('word')}
          />
          {errors.word ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.word.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="v-reading">Reading</Label>
          <Input
            id="v-reading"
            aria-invalid={Boolean(errors.reading)}
            {...register('reading')}
          />
          {errors.reading ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.reading.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-meaning">Meaning</Label>
        <Input
          id="v-meaning"
          aria-invalid={Boolean(errors.meaning)}
          {...register('meaning')}
        />
        {errors.meaning ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.meaning.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="v-pos">Part of speech</Label>
          <Controller
            name="partOfSpeech"
            control={control}
            render={({ field }) => (
              <Select
                items={posItems}
                value={field.value ?? POS_NONE}
                onValueChange={(value) =>
                  field.onChange(value === POS_NONE ? null : value)
                }
              >
                <SelectTrigger id="v-pos" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(posItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="v-jlpt">JLPT level</Label>
          <Controller
            name="jlptLevel"
            control={control}
            render={({ field }) => (
              <Select
                items={jlptItems}
                value={field.value ?? 'N2'}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="v-jlpt" className="w-full">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-notes">Notes</Label>
        <Textarea id="v-notes" rows={2} {...register('notes', clearable)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-ex-ja">Example sentence (Japanese)</Label>
        <Textarea
          id="v-ex-ja"
          rows={2}
          {...register('exampleSentenceOriginal', clearable)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="v-ex-en">Example sentence (translation)</Label>
        <Textarea
          id="v-ex-en"
          rows={2}
          {...register('exampleSentenceTranslation', clearable)}
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
