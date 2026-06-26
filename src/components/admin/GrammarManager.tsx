'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useAdminGrammar,
  useCreateGrammar,
  useDeleteGrammar,
  useUpdateGrammar,
  type AdminGrammar,
} from '@/hooks/use-admin-grammar'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { CreateGrammarInput, JlptLevel } from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { GrammarForm } from '@/components/admin/GrammarForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; row: AdminGrammar }
  | null

function toFormDefaults(g: AdminGrammar): Partial<CreateGrammarInput> {
  return {
    pattern: g.pattern,
    meaning: g.meaning,
    formation: g.formation,
    usageNotes: g.usageNotes,
    commonMistakes: g.commonMistakes,
    jlptLevel: g.jlptLevel as JlptLevel,
  }
}

export function GrammarManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminGrammar | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } = useAdminGrammar(
    {
      q: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
  )

  const createMutation = useCreateGrammar()
  const updateMutation = useUpdateGrammar()
  const deleteMutation = useDeleteGrammar()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleSubmit(values: CreateGrammarInput) {
    if (dialog?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialog.row.id, input: values },
        {
          onSuccess: () => {
            toast.success('Grammar updated')
            setDialog(null)
          },
          onError: (error) => showError(error, 'Could not update grammar'),
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Grammar created')
          setDialog(null)
        },
        onError: (error) => showError(error, 'Could not create grammar'),
      })
    }
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Grammar deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete grammar')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminGrammar>[] = [
    {
      header: 'Pattern',
      cell: (g) => <span className="font-medium">{g.pattern}</span>,
    },
    { header: 'Meaning', cell: (g) => g.meaning },
    {
      header: 'JLPT',
      className: 'w-20',
      cell: (g) => <Badge variant="secondary">{g.jlptLevel}</Badge>,
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (g) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog({ mode: 'edit', row: g })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(g)}
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
          placeholder="Search by pattern or meaning"
          aria-label="Search grammar"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setDialog({ mode: 'create' })}>New grammar</Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load grammar." onRetry={refetch} />
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
              getRowId={(g) => g.id}
              isLoading={isPending}
              emptyMessage="No grammar patterns yet."
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
        title={dialog?.mode === 'edit' ? 'Edit grammar' : 'New grammar'}
      >
        {dialog ? (
          <GrammarForm
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
          pendingDelete ? `grammar “${pendingDelete.pattern}”` : 'grammar'
        }
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
