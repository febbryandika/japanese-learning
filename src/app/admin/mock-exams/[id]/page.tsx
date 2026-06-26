import { requireAdminPage } from '@/lib/auth'
import { MockExamEditor } from '@/components/admin/MockExamEditor'

export default async function AdminMockExamEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminPage()
  const { id } = await params

  return <MockExamEditor examId={id} />
}
