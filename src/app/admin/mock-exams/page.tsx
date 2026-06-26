import { requireAdminPage } from '@/lib/auth'
import { MockExamsManager } from '@/components/admin/MockExamsManager'

export default async function AdminMockExamsPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mock Exams</h1>
        <p className="text-sm text-muted-foreground">
          Manage timed exams and their questions.
        </p>
      </div>
      <MockExamsManager />
    </div>
  )
}
