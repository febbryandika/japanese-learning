import { requireAdminPage } from '@/lib/auth'
import { VocabularyManager } from '@/components/admin/VocabularyManager'

export default async function AdminVocabularyPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Vocabulary</h1>
        <p className="text-sm text-muted-foreground">
          Manage N2 words, readings, meanings, and example sentences.
        </p>
      </div>
      <VocabularyManager />
    </div>
  )
}
