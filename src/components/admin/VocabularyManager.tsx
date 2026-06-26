'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useAdminVocabulary,
  useCreateVocabulary,
  useDeleteVocabulary,
  useUpdateVocabulary,
  type AdminVocabulary,
} from '@/hooks/use-admin-vocabulary'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type {
  CreateVocabularyInput,
  JlptLevel,
  VocabPartOfSpeech,
} from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { VocabularyForm } from '@/components/admin/VocabularyForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; row: AdminVocabulary }
  | null

// DB text columns are typed `string`; narrow to the form's enums.
function toFormDefaults(v: AdminVocabulary): Partial<CreateVocabularyInput> {
  return {
    word: v.word,
    reading: v.reading,
    meaning: v.meaning,
    partOfSpeech: (v.partOfSpeech as VocabPartOfSpeech | null) ?? undefined,
    jlptLevel: v.jlptLevel as JlptLevel,
    notes: v.notes,
    exampleSentenceOriginal: v.exampleSentenceOriginal,
    exampleSentenceTranslation: v.exampleSentenceTranslation,
  }
}

export function VocabularyManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminVocabulary | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useAdminVocabulary({
      q: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    })

  const createMutation = useCreateVocabulary()
  const updateMutation = useUpdateVocabulary()
  const deleteMutation = useDeleteVocabulary()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleSubmit(values: CreateVocabularyInput) {
    if (dialog?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialog.row.id, input: values },
        {
          onSuccess: () => {
            toast.success('Vocabulary updated')
            setDialog(null)
          },
          onError: (error) => showError(error, 'Could not update vocabulary'),
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Vocabulary created')
          setDialog(null)
        },
        onError: (error) => showError(error, 'Could not create vocabulary'),
      })
    }
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Vocabulary deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete vocabulary')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminVocabulary>[] = [
    { header: 'Word', cell: (v) => <span className="font-medium">{v.word}</span> },
    {
      header: 'Reading',
      cell: (v) => <span className="text-muted-foreground">{v.reading}</span>,
    },
    { header: 'Meaning', cell: (v) => v.meaning },
    {
      header: 'Part of speech',
      className: 'w-32',
      cell: (v) => v.partOfSpeech ?? '—',
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (v) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog({ mode: 'edit', row: v })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(v)}
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
          placeholder="Search by word, reading, or meaning"
          aria-label="Search vocabulary"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setDialog({ mode: 'create' })}>
          New vocabulary
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load vocabulary." onRetry={refetch} />
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
              getRowId={(v) => v.id}
              isLoading={isPending}
              emptyMessage="No vocabulary yet."
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
        title={dialog?.mode === 'edit' ? 'Edit vocabulary' : 'New vocabulary'}
      >
        {dialog ? (
          <VocabularyForm
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
          pendingDelete ? `vocabulary “${pendingDelete.word}”` : 'vocabulary'
        }
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
