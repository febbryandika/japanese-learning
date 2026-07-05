import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Quick access into the mock-exam module (SPEC §5.2). The exam list itself
// lives on /mock-exams; this card is the dashboard shortcut to it.
export function MockExamQuickAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Mock exams{' '}
          <span className="jp text-sm font-normal text-muted-foreground" lang="ja">
            模擬試験
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          href="/mock-exams"
          className="flex items-center gap-4 rounded-xl border bg-secondary/40 p-4 transition-colors hover:border-primary"
        >
          <span className="grid size-[46px] shrink-0 place-items-center rounded-xl bg-secondary">
            <GraduationCap className="size-5 text-primary" strokeWidth={1.7} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Take a mock exam</span>
            <span className="block text-xs text-muted-foreground">
              Timed, section-based practice with scoring and review
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  )
}
