'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  useAdminVideos,
  useCreateVideo,
  useDeleteVideo,
  useUpdateVideo,
  type AdminVideo,
} from '@/hooks/use-admin-videos'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { AdminApiError } from '@/hooks/admin-api'
import type { CreateVideoInput } from '@/lib/validations'
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable'
import { AdminFormDialog } from '@/components/admin/AdminFormDialog'
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog'
import { VideoForm } from '@/components/admin/VideoForm'
import { PaginationControls } from '@/components/PaginationControls'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 20

type DialogState =
  | { mode: 'create' }
  | { mode: 'edit'; row: AdminVideo }
  | null

// AdminVideo carries DB nulls + extra fields; the form wants Partial<CreateVideoInput>.
function toFormDefaults(video: AdminVideo): Partial<CreateVideoInput> {
  return {
    lessonGroupId: video.lessonGroupId,
    title: video.title,
    description: video.description ?? undefined,
    embedUrl: video.embedUrl ?? undefined,
    durationSeconds: video.durationSeconds ?? undefined,
    sortOrder: video.sortOrder,
    isPublished: video.isPublished,
  }
}

export function VideosManager() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminVideo | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { data, isPending, isError, isPlaceholderData, refetch } = useAdminVideos(
    {
      q: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
  )

  const createMutation = useCreateVideo()
  const updateMutation = useUpdateVideo()
  const deleteMutation = useDeleteVideo()

  function showError(error: unknown, fallback: string) {
    toast.error(error instanceof AdminApiError ? error.message : fallback)
  }

  function handleSubmit(values: CreateVideoInput) {
    if (dialog?.mode === 'edit') {
      updateMutation.mutate(
        { id: dialog.row.id, input: values },
        {
          onSuccess: () => {
            toast.success('Video updated')
            setDialog(null)
          },
          onError: (error) => showError(error, 'Could not update video'),
        },
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Video created')
          setDialog(null)
        },
        onError: (error) => showError(error, 'Could not create video'),
      })
    }
  }

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Video deleted')
        setPendingDelete(null)
      },
      onError: (error) => {
        showError(error, 'Could not delete video')
        setPendingDelete(null)
      },
    })
  }

  const columns: AdminColumn<AdminVideo>[] = [
    {
      header: 'Title',
      cell: (video) => <span className="font-medium">{video.title}</span>,
    },
    {
      header: 'Group',
      cell: (video) => (
        <span className="text-muted-foreground">{video.groupTitle ?? '—'}</span>
      ),
    },
    { header: 'Order', cell: (video) => video.sortOrder, className: 'w-16' },
    {
      header: 'Status',
      className: 'w-28',
      cell: (video) =>
        video.isPublished ? (
          <Badge>Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (video) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialog({ mode: 'edit', row: video })}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingDelete(video)}
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
          placeholder="Search videos"
          aria-label="Search videos"
          className="sm:max-w-xs"
        />
        <Button onClick={() => setDialog({ mode: 'create' })}>New video</Button>
      </div>

      {isError ? (
        <ErrorState message="Couldn’t load videos." onRetry={refetch} />
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
              getRowId={(video) => video.id}
              isLoading={isPending}
              emptyMessage="No videos yet."
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
        title={dialog?.mode === 'edit' ? 'Edit video' : 'New video'}
      >
        {dialog ? (
          <VideoForm
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
          pendingDelete ? `video “${pendingDelete.title}”` : 'video'
        }
        onConfirm={handleDelete}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
