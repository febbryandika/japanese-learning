'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'

import {
  createKanjiSchema,
  JLPT_LEVELS,
  kanjiCompoundSchema,
  type CreateKanjiFormValues,
  type CreateKanjiInput,
  type KanjiCompound,
} from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const jlptItems = Object.fromEntries(JLPT_LEVELS.map((level) => [level, level]))
const clearable = { setValueAs: (v: string) => (v === '' ? null : v) }

// `notes` is a JSON-stringified compound list; parse defensively for the editor.
function parseCompounds(notes: string | null | undefined): KanjiCompound[] {
  if (!notes) return []
  try {
    const parsed = kanjiCompoundSchema.safeParse(JSON.parse(notes))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export function KanjiForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<CreateKanjiInput>
  onSubmit: (values: CreateKanjiInput) => void
  submitting: boolean
}) {
  // Compounds are edited as structured rows, then serialized back into `notes`.
  const [compounds, setCompounds] = useState<KanjiCompound[]>(() =>
    parseCompounds(defaultValues?.notes),
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateKanjiFormValues, unknown, CreateKanjiInput>({
    resolver: zodResolver(createKanjiSchema),
    defaultValues: {
      character: defaultValues?.character ?? '',
      onyomi: defaultValues?.onyomi ?? undefined,
      kunyomi: defaultValues?.kunyomi ?? undefined,
      meaning: defaultValues?.meaning ?? '',
      strokeCount: defaultValues?.strokeCount ?? undefined,
      jlptLevel: defaultValues?.jlptLevel ?? 'N2',
      // `notes` is owned by the compounds editor below, not a form field.
      notes: undefined,
    },
  })

  function submit(values: CreateKanjiInput) {
    // Drop blank rows; empty list clears the column (merge-patch).
    const cleaned = compounds.filter(
      (c) => c.word.trim() || c.reading.trim() || c.meaning.trim(),
    )
    const notes = cleaned.length > 0 ? JSON.stringify(cleaned) : null
    onSubmit({ ...values, notes })
  }

  function updateCompound(
    index: number,
    key: keyof KanjiCompound,
    value: string,
  ) {
    setCompounds((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    )
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="max-h-[70vh] space-y-4 overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="k-character">Character</Label>
          <Input
            id="k-character"
            maxLength={1}
            aria-invalid={Boolean(errors.character)}
            {...register('character')}
          />
          {errors.character ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.character.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="k-stroke">Stroke count</Label>
          <Input
            id="k-stroke"
            type="number"
            inputMode="numeric"
            aria-invalid={Boolean(errors.strokeCount)}
            {...register('strokeCount', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          {errors.strokeCount ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.strokeCount.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="k-onyomi">On’yomi</Label>
          <Input id="k-onyomi" {...register('onyomi', clearable)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="k-kunyomi">Kun’yomi</Label>
          <Input id="k-kunyomi" {...register('kunyomi', clearable)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="k-meaning">Meaning</Label>
        <Input
          id="k-meaning"
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
        <Label htmlFor="k-jlpt">JLPT level</Label>
        <Controller
          name="jlptLevel"
          control={control}
          render={({ field }) => (
            <Select
              items={jlptItems}
              value={field.value ?? 'N2'}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="k-jlpt" className="w-32">
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

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium">Example compounds</legend>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCompounds((prev) => [
                ...prev,
                { word: '', reading: '', meaning: '' },
              ])
            }
          >
            <Plus className="size-4" aria-hidden />
            Add
          </Button>
        </div>
        {compounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No compounds yet.</p>
        ) : (
          <ul className="space-y-2">
            {compounds.map((compound, index) => (
              <li key={index} className="flex items-center gap-2">
                <Input
                  aria-label={`Compound ${index + 1} word`}
                  placeholder="語"
                  value={compound.word}
                  onChange={(e) => updateCompound(index, 'word', e.target.value)}
                />
                <Input
                  aria-label={`Compound ${index + 1} reading`}
                  placeholder="reading"
                  value={compound.reading}
                  onChange={(e) =>
                    updateCompound(index, 'reading', e.target.value)
                  }
                />
                <Input
                  aria-label={`Compound ${index + 1} meaning`}
                  placeholder="meaning"
                  value={compound.meaning}
                  onChange={(e) =>
                    updateCompound(index, 'meaning', e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove compound ${index + 1}`}
                  onClick={() =>
                    setCompounds((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
