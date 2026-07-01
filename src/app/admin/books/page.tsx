import { requireAdminPage } from '@/lib/auth'
import { BooksManager } from '@/components/admin/BooksManager'

export default async function AdminBooksPage() {
  await requireAdminPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Books</h1>
        <p className="text-sm text-muted-foreground">
          Upload light-novel EPUBs and manage the reader library.
        </p>
      </div>
      <BooksManager />
    </div>
  )
}
