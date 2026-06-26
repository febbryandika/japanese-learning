import { requireAdminPage } from '@/lib/auth'
import { VideosManager } from '@/components/admin/VideosManager'

export default async function AdminVideosPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Videos</h1>
        <p className="text-sm text-muted-foreground">
          Manage video lessons and their publish state.
        </p>
      </div>
      <VideosManager />
    </div>
  )
}
