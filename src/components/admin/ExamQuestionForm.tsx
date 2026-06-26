'use client'

import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'

import {
  EXAM_SECTIONS,
  examQuestionSchema,
  type ExamQuestionInput,
  type ExamSection,
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

const sectionItems = Object.fromEntries(EXAM_SECTIONS.map((s) => [s, s]))

type Defaults = Partial<ExamQuestionInput>

export function ExamQuestionForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Defaults
  onSubmit: (values: ExamQuestionInput) => void
  submitting: boolean
}) {
  const [sectionName, setSectionName] = useState<ExamSection>(
    defaultValues?.sectionName ?? '文法',
  )
  const [prompt, setPrompt] = useState(defaultValues?.prompt ?? '')
  const [choices, setChoices] = useState<string[]>(
    defaultValues?.choices ?? ['', ''],
  )
  // Track the correct answer by index so editing a choice's text keeps the link.
  const [correctIndex, setCorrectIndex] = useState(() => {
    const i = defaultValues?.choices?.indexOf(defaultValues.correctAnswer ?? '')
    return i != null && i >= 0 ? i : 0
  })
  const [explanation, setExplanation] = useState(
    defaultValues?.explanation ?? '',
  )
  const [sortOrder, setSortOrder] = useState(defaultValues?.sortOrder ?? 0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function setChoice(index: number, value: string) {
    setChoices((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  function addChoice() {
    setChoices((prev) => (prev.length < 6 ? [...prev, ''] : prev))
  }

  function removeChoice(index: number) {
    setChoices((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev))
    setCorrectIndex((prev) => {
      if (index === prev) return 0
      return index < prev ? prev - 1 : prev
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const candidate = {
      sectionName,
      prompt,
      choices,
      correctAnswer: choices[correctIndex] ?? '',
      explanation: explanation.trim() === '' ? null : explanation,
      sortOrder,
    }
    const parsed = examQuestionSchema.safeParse(candidate)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        next[key] ??= issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    onSubmit(parsed.data)
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="max-h-[70vh] space-y-4 overflow-y-auto"
    >
      <div className="space-y-2">
        <Label htmlFor="q-section">Section</Label>
        <Select
          items={sectionItems}
          value={sectionName}
          onValueChange={(value) => setSectionName(value as ExamSection)}
        >
          <SelectTrigger id="q-section" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXAM_SECTIONS.map((section) => (
              <SelectItem key={section} value={section}>
                {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="q-prompt">Prompt</Label>
        <Textarea
          id="q-prompt"
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          aria-invalid={Boolean(errors.prompt)}
        />
        {errors.prompt ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.prompt}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium">
            Choices (select the correct answer)
          </legend>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChoice}
            disabled={choices.length >= 6}
          >
            <Plus className="size-4" aria-hidden />
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {choices.map((choice, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-choice"
                aria-label={`Mark choice ${index + 1} correct`}
                checked={correctIndex === index}
                onChange={() => setCorrectIndex(index)}
                className="size-4 accent-primary"
              />
              <Input
                aria-label={`Choice ${index + 1}`}
                value={choice}
                onChange={(e) => setChoice(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove choice ${index + 1}`}
                onClick={() => removeChoice(index)}
                disabled={choices.length <= 2}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        {errors.choices ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.choices}
          </p>
        ) : null}
        {errors.correctAnswer ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.correctAnswer}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="q-explanation">Explanation</Label>
        <Textarea
          id="q-explanation"
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="q-sort">Sort order</Label>
        <Input
          id="q-sort"
          type="number"
          inputMode="numeric"
          className="w-32"
          value={sortOrder}
          onChange={(e) =>
            setSortOrder(e.target.value === '' ? 0 : Number(e.target.value))
          }
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save question'}
        </Button>
      </div>
    </form>
  )
}
