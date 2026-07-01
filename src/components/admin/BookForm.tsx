'use client'

import { useState, type FormEvent } from 'react'

import type { UpdateBookInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type BookFormProps = {
  mode: 'create' | 'edit'
  defaultValues?: {
    title?: string
    author?: string | null
    isPublished?: boolean
  }
  // create: the multipart body (file + metadata); edit: metadata only.
  onCreate?: (formData: FormData) => void
  onUpdate?: (input: UpdateBookInput) => void
  submitting: boolean
}

export function BookForm({
  mode,
  defaultValues,
  onCreate,
  onUpdate,
  submitting,
}: BookFormProps) {
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [author, setAuthor] = useState(defaultValues?.author ?? '')
  const [isPublished, setIsPublished] = useState(
    defaultValues?.isPublished ?? false,
  )
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (mode === 'edit') {
      onUpdate?.({
        title: title.trim(),
        author: author.trim() || null,
        isPublished,
      })
      return
    }

    if (!file) {
      setError('Choose an EPUB file to upload')
      return
    }

    setError(null)
    const formData = new FormData()
    formData.set('file', file)
    formData.set('title', title.trim())
    formData.set('author', author.trim())
    formData.set('isPublished', String(isPublished))
    onCreate?.(formData)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="b-title">Title</Label>
        <Input
          id="b-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(error && !title.trim())}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="b-author">Author</Label>
        <Input
          id="b-author"
          value={author ?? ''}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      {mode === 'create' ? (
        <div className="space-y-2">
          <Label htmlFor="b-file">EPUB file</Label>
          <Input
            id="b-file"
            type="file"
            accept=".epub,application/epub+zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Stored privately; served only to signed-in readers.
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Switch
          id="b-pub"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
        <Label htmlFor="b-pub">Published</Label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? mode === 'create'
              ? 'Uploading…'
              : 'Saving…'
            : mode === 'create'
              ? 'Upload book'
              : 'Save'}
        </Button>
      </div>
    </form>
  )
}
