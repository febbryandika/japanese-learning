import Link from 'next/link'

import { requireAdminPage } from '@/lib/auth'
import { getAdminCounts } from '@/services/admin/overview.service'
import { ADMIN_SECTIONS } from '@/components/admin/sections'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboardPage() {
  // Self-guard before fetching: the layout guard does not block this page's own
  // data fetch (layout and page render concurrently).
  await requireAdminPage()
  const counts = await getAdminCounts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content Management</h1>
        <p className="text-sm text-muted-foreground">
          Create, edit, and publish every resource type.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => {
          const total = counts[section.key]
          return (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors hover:ring-ring">
                <CardHeader>
                  <CardTitle>{section.label}</CardTitle>
                  <CardDescription>
                    {total} {total === 1 ? 'item' : 'items'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
