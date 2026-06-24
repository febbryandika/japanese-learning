import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Quick access to mock exams. The exam module is Phase 3, so there are no exams
// to list yet — this shows an empty state with no broken link until then.
export function MockExamQuickAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock exams</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No mock exams available yet. Check back soon.
        </p>
      </CardContent>
    </Card>
  )
}
