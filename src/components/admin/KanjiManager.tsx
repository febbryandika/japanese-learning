'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useAdminKanji,
  useCreateKanji,
  useDeleteKanji,
  useUpdateKanji,
  type AdminKanji,
} from '@/hooks/use-admin-kanji'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { CreateKanjiInput, JlptLevel } from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { KanjiForm } from '@/components/admin/KanjiForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

type DialogState = { mode: 'create' } | { mode: 'edit'; row: AdminKanji } | null

// AdminKanji.jlptLevel is `string` (text column); narrow to the form's enum.
function toFormDefaults(kanji: AdminKanji): Partial<CreateKanjiInput> {
  return {
    character: kanji.character,
    onyomi: kanji.onyomi,
    kunyomi: kanji.kunyomi,
    meaning: kanji.meaning,
    strokeCount: kanji.strokeCount,
    jlptLevel: kanji.jlptLevel as JlptLevel,
    notes: kanji.notes,
  }
}

export function KanjiManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminKanji | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } = useAdminKanji({
    q: debouncedSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const createMutation = useCreateKanji()
  const updateMutation = useUpdateKanji()
  const deleteMutation = useDeleteKanji()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleSubmit(values: CreateKanjiInput) {
    if (dialog?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialog.row.id, input: values },
        {
          onSuccess: () => {
            toast.success('Kanji updated')
            setDialog(null)
          },
          onError: (error) => showError(error, 'Could not update kanji'),
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Kanji created')
          setDialog(null)
        },
        onError: (error) => showError(error, 'Could not create kanji'),
      })
    }
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Kanji deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete kanji')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminKanji>[] = [
    {
      header: 'Character',
      className: 'w-20',
      cell: (kanji) => <span className="text-xl font-medium">{kanji.character}</span>,
    },
    { header: 'Meaning', cell: (kanji) => kanji.meaning },
    {
      header: 'Strokes',
      className: 'w-20',
      cell: (kanji) => kanji.strokeCount ?? '—',
    },
    {
      header: 'JLPT',
      className: 'w-20',
      cell: (kanji) => <Badge variant="secondary">{kanji.jlptLevel}</Badge>,
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (kanji) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog({ mode: 'edit', row: kanji })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(kanji)}
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
          placeholder="Search by character, reading, or meaning"
          aria-label="Search kanji"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setDialog({ mode: 'create' })}>New kanji</Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load kanji." onRetry={refetch} />
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
              getRowId={(kanji) => kanji.id}
              isLoading={isPending}
              emptyMessage="No kanji yet."
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
        title={dialog?.mode === 'edit' ? 'Edit kanji' : 'New kanji'}
      >
        {dialog ? (
          <KanjiForm
            defaultValues={
              dialog.mode === 'edit' ? toFormDefaults(dialog.row) : undefined
            }
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
          pendingDelete ? `kanji “${pendingDelete.character}”` : 'kanji'
        }
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
