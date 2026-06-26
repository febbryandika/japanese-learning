'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  useAddExamQuestion,
  useAdminMockExam,
  useDeleteExamQuestion,
  useUpdateExamQuestion,
  useUpdateMockExam,
  type AdminExamQuestion,
} from '@/hooks/use-admin-mock-exams'
import { AdminApiError } from '@/hooks/admin-api'
import type {
  CreateMockExamInput,
  ExamQuestionInput,
  ExamSection,
} from '@/lib/validations'
import { MockExamForm } from '@/components/admin/MockExamForm'
import { ExamQuestionForm } from '@/components/admin/ExamQuestionForm'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type QuestionDialog =
  | { mode: 'create' }
  | { mode: 'edit'; question: AdminExamQuestion }
  | null

function toQuestionDefaults(
  question: AdminExamQuestion,
): Partial<ExamQuestionInput> {
  return {
    sectionName: question.sectionName as ExamSection,
    prompt: question.prompt,
    choices: question.choices,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    sortOrder: question.sortOrder,
  }
}

export function MockExamEditor({ examId }: { examId: string }) {
  const { data, isPending, isError, refetch } = useAdminMockExam(examId)

  const updateExam = useUpdateMockExam()
  const addQuestion = useAddExamQuestion(examId)
  const updateQuestion = useUpdateExamQuestion(examId)
  const deleteQuestion = useDeleteExamQuestion(examId)

  const [questionDialog, setQuestionDialog] = useState<QuestionDialog>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminExamQuestion | null>(
    null,
  )

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleMetaSubmit(values: CreateMockExamInput) {
    updateExam.mutate(
      { id: examId, input: values },
      {
        onSuccess: () => toast.success('Exam details saved'),
        onError: (error) => showError(error, 'Could not save exam details'),
      },
    )
  }

  function handleQuestionSubmit(values: ExamQuestionInput) {
    if (questionDialog?.mode === 'edit') {
      updateQuestion.mutate(
        { questionId: questionDialog.question.id, input: values },
        {
          onSuccess: () => {
            toast.success('Question updated')
            setQuestionDialog(null)
          },
          onError: (error) => showError(error, 'Could not update question'),
        },
      )
    } else {
      addQuestion.mutate(values, {
        onSuccess: () => {
          toast.success('Question added')
          setQuestionDialog(null)
        },
        onError: (error) => showError(error, 'Could not add question'),
      })
    }
  }

  function handleDeleteQuestion() {
    if (!pendingDelete) return
    deleteQuestion.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Question deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete question')
        setPendingDelete(null)
      },
    })
  }

  const backLink = (
    <Link
      href="/admin/mock-exams"
      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      ← All mock exams
    </Link>
  )

  if (isPending) {
    return (
      <div className="space-y-4">
        {backLink}
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        {backLink}
        <ErrorState message="Couldn’t load this mock exam." onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {backLink}

      <Card>
        <CardHeader>
          <CardTitle>Exam details</CardTitle>
        </CardHeader>
        <CardContent>
          <MockExamForm
            defaultValues={{
              title: data.title,
              description: data.description,
              timeLimitMinutes: data.timeLimitMinutes,
              isPublished: data.isPublished,
            }}
            onSubmit={handleMetaSubmit}
            submitting={updateExam.isPending}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Questions ({data.questions.length})
          </h2>
          <Button onClick={() => setQuestionDialog({ mode: 'create' })}>
            Add question
          </Button>
        </div>

        {data.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions yet. Add the first one.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.questions.map((question) => (
              <li key={question.id}>
                <Card>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{question.sectionName}</Badge>
                        <span className="text-xs text-muted-foreground">
                          #{question.sortOrder}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuestionDialog({ mode: 'edit', question })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setPendingDelete(question)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{question.prompt}</p>
                    <ul className="space-y-1 text-sm">
                      {question.choices.map((choice, index) => {
                        const isCorrect = choice === question.correctAnswer
                        return (
                          <li
                            key={index}
                            className={
                              isCorrect
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            }
                          >
                            {isCorrect ? '✓ ' : '• '}
                            {choice}
                          </li>
                        )
                      })}
                    </ul>
                    {question.explanation ? (
                      <p className="text-sm text-muted-foreground">
                        {question.explanation}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminFormDialog
        open={questionDialog !== null}
        onOpenChange={(open) => {
          if (!open) setQuestionDialog(null)
        }}
        title={
          questionDialog?.mode === 'edit' ? 'Edit question' : 'Add question'
        }
      >
        {questionDialog ? (
          <ExamQuestionForm
            defaultValues={
              questionDialog.mode === 'edit'
                ? toQuestionDefaults(questionDialog.question)
                : undefined
            }
            onSubmit={handleQuestionSubmit}
            submitting={addQuestion.isPending || updateQuestion.isPending}
          />
        ) : null}
      </AdminFormDialog>

      <AdminDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        resourceLabel="this question"
        onConfirm={handleDeleteQuestion}
        pending={deleteQuestion.isPending}
      />
    </div>
  )
}
