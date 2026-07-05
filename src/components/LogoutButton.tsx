'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

// Compact icon button that lives beside the user chip in the sidebar rail.
// Keeps the accessible name "Sign out" (asserted by the auth e2e spec).
export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleLogout}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" aria-hidden />
      <span className="sr-only">Sign out</span>
    </Button>
  )
}
