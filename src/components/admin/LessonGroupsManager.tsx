'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useAdminLessonGroups,
  useCreateLessonGroup,
  useDeleteLessonGroup,
  useUpdateLessonGroup,
  type AdminLessonGroup,
} from '@/hooks/use-admin-lesson-groups'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { CreateLessonGroupInput } from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { LessonGroupForm } from '@/components/admin/LessonGroupForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; row: AdminLessonGroup }
  | null

export function LessonGroupsManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminLessonGroup | null>(
    null,
  )

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useAdminLessonGroups({
      q: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    })

  const createMutation = useCreateLessonGroup()
  const updateMutation = useUpdateLessonGroup()
  const deleteMutation = useDeleteLessonGroup()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleSubmit(values: CreateLessonGroupInput) {
    if (dialog?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialog.row.id, input: values },
        {
          onSuccess: () => {
            toast.success('Lesson group updated')
            setDialog(null)
          },
          onError: (error) => showError(error, 'Could not update lesson group'),
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Lesson group created')
          setDialog(null)
        },
        onError: (error) => showError(error, 'Could not create lesson group'),
      })
    }
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Lesson group deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete lesson group')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminLessonGroup>[] = [
    {
      header: 'Title',
      cell: (group) => <span className="font-medium">{group.title}</span>,
    },
    {
      header: 'Slug',
      cell: (group) => (
        <span className="text-muted-foreground">{group.slug}</span>
      ),
    },
    { header: 'Order', cell: (group) => group.sortOrder, className: 'w-16' },
    {
      header: 'Status',
      className: 'w-28',
      cell: (group) =>
        group.isPublished ? (
          <Badge>Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (group) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog({ mode: 'edit', row: group })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(group)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const submitting = createMutation.isPending || updateMutation.isPending

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
          placeholder="Search lesson groups"
          aria-label="Search lesson groups"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setDialog({ mode: 'create' })}>
          New lesson group
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load lesson groups." onRetry={refetch} />
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
              getRowId={(group) => group.id}
              isLoading={isPending}
              emptyMessage="No lesson groups yet."
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
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        title={dialog?.mode === 'edit' ? 'Edit lesson group' : 'New lesson group'}
      >
        {dialog ? (
          <LessonGroupForm
            defaultValues={dialog.mode === 'edit' ? dialog.row : undefined}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        ) : null}
      </AdminFormDialog>

      <AdminDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        resourceLabel={
          pendingDelete
            ? `lesson group “${pendingDelete.title}”`
            : 'lesson group'
        }
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
