import { requireAdminPage } from '@/lib/auth'
import { KanjiManager } from '@/components/admin/KanjiManager'

export default async function AdminKanjiPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kanji</h1>
        <p className="text-sm text-muted-foreground">
          Manage N2 kanji, readings, and example compounds.
        </p>
      </div>
      <KanjiManager />
    </div>
  )
}
