'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { useResetPassword } from '@/hooks/use-admin-users'
import { AdminApiError } from '@/hooks/admin-api'
import type { AdminUser } from '@/services/admin/user.service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'generate' | 'manual'

export function ResetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: AdminUser | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {user ? `Set a new password for ${user.name} (${user.email}).` : null}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed by user id so switching targets (or reopening) remounts with
            fresh local state instead of needing an effect to reset it. */}
        {user ? (
          <ResetPasswordForm
            key={user.id}
            userId={user.id}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordForm({
  userId,
  onDone,
}: {
  userId: string
  onDone: () => void
}) {
  const [mode, setMode] = useState<Mode>('generate')
  const [manualPassword, setManualPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const resetMutation = useResetPassword()

  function handleSubmit() {
    const input =
      mode === 'generate'
        ? ({ mode: 'generate' } as const)
        : ({ mode: 'manual', password: manualPassword } as const)

    resetMutation.mutate(
      { id: userId, input },
      {
        onSuccess: (result) => {
          if (result.password) {
            setGeneratedPassword(result.password)
          } else {
            toast.success('Password updated')
            onDone()
          }
        },
        onError: (error) => {
          toast.error(
            error instanceof AdminApiError ? error.message : 'Could not reset password',
          )
        },
      },
    )
  }

  async function handleCopy() {
    if (!generatedPassword) return
    await navigator.clipboard.writeText(generatedPassword)
    toast.success('Password copied to clipboard')
  }

  const manualTooShort =
    mode === 'manual' && manualPassword.length > 0 && manualPassword.length < 8

  return (
    <>
      {generatedPassword ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rp-generated">New password</Label>
            <div className="flex gap-2">
              <Input id="rp-generated" readOnly value={generatedPassword} />
              <Button type="button" variant="outline" onClick={handleCopy}>
                Copy
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This password is shown only once. Make sure to copy it before closing this
            dialog.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div role="group" aria-label="Reset method" className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'generate' ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={mode === 'generate'}
              onClick={() => setMode('generate')}
            >
              Generate random password
            </Button>
            <Button
              type="button"
              variant={mode === 'manual' ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={mode === 'manual'}
              onClick={() => setMode('manual')}
            >
              Set password manually
            </Button>
          </div>

          {mode === 'manual' ? (
            <div className="space-y-2">
              <Label htmlFor="rp-manual">New password</Label>
              <Input
                id="rp-manual"
                type="password"
                value={manualPassword}
                onChange={(event) => setManualPassword(event.target.value)}
                aria-invalid={manualTooShort}
              />
              {manualTooShort ? (
                <p role="alert" className="text-sm text-destructive">
                  Password must be at least 8 characters
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <DialogFooter>
        {generatedPassword ? (
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              resetMutation.isPending || (mode === 'manual' && manualPassword.length < 8)
            }
          >
            {resetMutation.isPending ? 'Resetting…' : 'Reset password'}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
