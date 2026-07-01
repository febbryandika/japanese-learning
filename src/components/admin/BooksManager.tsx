'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useAdminBooks,
  useCreateBook,
  useDeleteBook,
  useUpdateBook,
  type AdminBook,
} from '@/hooks/use-admin-books'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { UpdateBookInput } from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { BookForm } from '@/components/admin/BookForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

type DialogState = { mode: 'create' } | { mode: 'edit'; row: AdminBook } | null

export function BooksManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminBook | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } = useAdminBooks({
    q: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const createMutation = useCreateBook()
  const updateMutation = useUpdateBook()
  const deleteMutation = useDeleteBook()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleCreate(formData: FormData) {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Book uploaded')
        setDialog(null)
      },
      onError: (error) => showError(error, 'Could not save book'),
    })
  }

  function handleUpdate(input: UpdateBookInput) {
    if (dialog?.mode !== 'edit') return
    updateMutation.mutate(
      { id: dialog.row.id, input },
      {
        onSuccess: () => {
          toast.success('Book updated')
          setDialog(null)
        },
        onError: (error) => showError(error, 'Could not update book'),
      },
    )
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Book deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete book')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminBook>[] = [
    {
      header: 'Title',
      cell: (book) => <span className="font-medium">{book.title}</span>,
    },
    {
      header: 'Author',
      cell: (book) => (
        <span className="text-muted-foreground">{book.author ?? '—'}</span>
      ),
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (book) =>
        book.isPublished ? (
          <Badge>Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (book) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog({ mode: 'edit', row: book })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(book)}
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
          placeholder="Search books"
          aria-label="Search books"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setDialog({ mode: 'create' })}>Upload book</Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load books." onRetry={refetch} />
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
              getRowId={(book) => book.id}
              isLoading={isPending}
              emptyMessage="No books yet."
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
        title={dialog?.mode === 'edit' ? 'Edit book' : 'Upload book'}
        description={
          dialog?.mode === 'edit'
            ? undefined
            : 'Upload an EPUB file and set its metadata.'
        }
      >
        {dialog?.mode === 'edit' ? (
          <BookForm
            mode="edit"
            defaultValues={{
              title: dialog.row.title,
              author: dialog.row.author,
              isPublished: dialog.row.isPublished,
            }}
            onUpdate={handleUpdate}
            submitting={updateMutation.isPending}
          />
        ) : dialog?.mode === 'create' ? (
          <BookForm
            mode="create"
            onCreate={handleCreate}
            submitting={createMutation.isPending}
          />
        ) : null}
      </AdminFormDialog>

      <AdminDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        resourceLabel={pendingDelete ? `book “${pendingDelete.title}”` : 'book'}
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
