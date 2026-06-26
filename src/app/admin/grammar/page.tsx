import { requireAdminPage } from '@/lib/auth'
import { GrammarManager } from '@/components/admin/GrammarManager'

export default async function AdminGrammarPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Grammar</h1>
        <p className="text-sm text-muted-foreground">
          Manage N2 grammar patterns, formation, and usage notes.
        </p>
      </div>
      <GrammarManager />
    </div>
  )
}
