import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { getServerSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { LogoutButton } from '@/components/LogoutButton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) {
    redirect('/login')
  }

  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1)

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, {session.user.name}</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Role:{' '}
            <span className="font-medium text-foreground">
              {profile?.role ?? 'learner'}
            </span>
          </p>
          <Link
            href="/videos"
            className="block w-fit text-sm font-medium text-foreground underline"
          >
            Browse video lessons
          </Link>
          <Link
            href="/kanji"
            className="block w-fit text-sm font-medium text-foreground underline"
          >
            Browse kanji
          </Link>
          <Link
            href="/vocabulary"
            className="block w-fit text-sm font-medium text-foreground underline"
          >
            Browse vocabulary
          </Link>
          <Link
            href="/grammar"
            className="block w-fit text-sm font-medium text-foreground underline"
          >
            Browse grammar
          </Link>
          <Link
            href="/bookmarks"
            className="block w-fit text-sm font-medium text-foreground underline"
          >
            View bookmarks
          </Link>
          <Link
            href="/progress"
            className="block w-fit text-sm font-medium text-foreground underline"
          >
            View progress
          </Link>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  )
}
