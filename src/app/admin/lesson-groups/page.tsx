import { requireAdminPage } from '@/lib/auth'
import { LessonGroupsManager } from '@/components/admin/LessonGroupsManager'

export default async function AdminLessonGroupsPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lesson Groups</h1>
        <p className="text-sm text-muted-foreground">
          Organize video lessons into the seven content groups.
        </p>
      </div>
      <LessonGroupsManager />
    </div>
  )
}
