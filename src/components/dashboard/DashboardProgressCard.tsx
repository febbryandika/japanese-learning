import Link from 'next/link'

import type { DashboardProgressStat } from '@/lib/validations'

// A single Progress Summary card, Sumi Night style: a conic-gradient ring with
// the percentage + Japanese label in the hole, stats beside it. Links to the
// resource's browse page. `mastered / total` per SPEC §5.2.
export function DashboardProgressCard({
  label,
  jpLabel,
  ringColor,
  stat,
  href,
}: {
  label: string
  jpLabel: string
  ringColor: string
  stat: DashboardProgressStat
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-primary"
    >
      <div
        role="progressbar"
        aria-valuenow={stat.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} mastered`}
        className="grid size-[104px] shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${ringColor} ${stat.percentage}%, rgb(255 255 255 / 0.08) 0)`,
          filter: `drop-shadow(0 0 10px ${ringColor})`,
        }}
      >
        <div className="flex size-[76px] flex-col items-center justify-center rounded-full bg-card">
          <span className="text-[22px] leading-none font-bold tabular-nums">
            {stat.percentage}%
          </span>
          <span className="jps mt-0.5 text-xs text-muted-foreground" lang="ja">
            {jpLabel}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-1 text-[12.5px] text-muted-foreground">
          {stat.mastered} / {stat.total} mastered
        </div>
      </div>
    </Link>
  )
}
