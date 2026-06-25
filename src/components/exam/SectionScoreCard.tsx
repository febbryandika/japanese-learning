import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ExamReviewSectionScore } from '@/lib/validations'

export function SectionScoreCard({
  sections,
}: {
  sections: ExamReviewSectionScore[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Section scores</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y rounded-lg border">
          {sections.map((section) => (
            <li
              key={section.sectionName}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span>{section.sectionName}</span>
              <span className="tabular-nums text-muted-foreground">
                {section.scoreTotal} / {section.scoreMax} ({section.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
