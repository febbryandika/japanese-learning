'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  useAdminMockExams,
  useCreateMockExam,
  useDeleteMockExam,
  type AdminMockExam,
} from '@/hooks/use-admin-mock-exams'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { CreateMockExamInput } from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { MockExamForm } from '@/components/admin/MockExamForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

export function MockExamsManager() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AdminMockExam | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useAdminMockExams({ q: debouncedSearch || undefined, page, pageSize: PAGE_SIZE })

  const createMutation = useCreateMockExam()
  const deleteMutation = useDeleteMockExam()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleCreate(values: CreateMockExamInput) {
    createMutation.mutate(values, {
      onSuccess: (exam) => {
        toast.success('Mock exam created')
        setCreateOpen(false)
        // Jump straight to the editor so questions can be added.
        router.push(`/admin/mock-exams/${exam.id}`)
      },
      onError: (error) => showError(error, 'Could not create mock exam'),
    })
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Mock exam deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete mock exam')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminMockExam>[] = [
    {
      header: 'Title',
      cell: (exam) => <span className="font-medium">{exam.title}</span>,
    },
    {
      header: 'Questions',
      className: 'w-24',
      cell: (exam) => exam.questionCount,
    },
    {
      header: 'Time limit',
      className: 'w-28',
      cell: (exam) => `${exam.timeLimitMinutes} min`,
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (exam) =>
        exam.isPublished ? (
          <Badge>Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (exam) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/mock-exams/${exam.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(exam)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search mock exams"
          aria-label="Search mock exams"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setCreateOpen(true)}>New mock exam</Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load mock exams." onRetry={refetch} />
      ) : (
        <>
          <div
            className={
              isPlaceholderData ? 'opacity-60 transition-opacity' : undefined
            }
          >
            <AdminTable
              columns={columns}
              rows={data?.data ?? []}
              getRowId={(exam) => exam.id}
              isLoading={isPending}
              emptyMessage="No mock exams yet."
            />
          </div>
          {data && data.pagination.totalPages > 1 ? (
            <PaginationControls
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <AdminFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New mock exam"
        description="Create the exam, then add questions in the editor."
      >
        {createOpen ? (
          <MockExamForm
            onSubmit={handleCreate}
            submitting={createMutation.isPending}
            submitLabel="Create"
          />
        ) : null}
      </AdminFormDialog>

      <AdminDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        resourceLabel={
          pendingDelete ? `mock exam “${pendingDelete.title}”` : 'mock exam'
        }
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
