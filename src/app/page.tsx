import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, GraduationCap, Sparkles, TrendingUp } from 'lucide-react'

import { getServerSession } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  {
    glyph: '漢',
    label: 'Kanji',
    stat: '390 kanji',
    description:
      'Every N2 kanji with readings, meanings, stroke counts, and compound vocabulary.',
  },
  {
    glyph: '語',
    label: 'Vocabulary',
    stat: '3,434 words',
    description: 'The full N2 word list with readings, meanings, and example sentences.',
  },
  {
    glyph: '文',
    label: 'Grammar',
    stat: '135 patterns',
    description: '639 curated example sentences showing each pattern in context.',
  },
  {
    icon: GraduationCap,
    label: 'Mock exams',
    jpLabel: '模擬試験',
    description:
      'Timed, section-based practice exams with server-scored results and full answer review.',
  },
  {
    icon: BookOpen,
    label: 'Light novel reader',
    description:
      'Read real epub novels in the browser and tap any word for an instant kanji or vocabulary lookup.',
  },
  {
    icon: Sparkles,
    label: 'AI example sentences',
    description:
      'Generate fresh, contextual example sentences on demand for any word or pattern.',
  },
] as const

export default async function HomePage() {
  const session = await getServerSession()
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span
            className="seal size-9 rounded-[10px] text-[19px] font-semibold"
            aria-hidden
          >
            学
          </span>
          <span className="leading-none">
            <span className="block text-[14px] font-bold tracking-tight">JLPT N2</span>
            <span className="mt-1 block text-[9px] font-medium tracking-[0.14em] text-muted-foreground">
              STUDY
            </span>
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-8">
        <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden py-16 text-center sm:py-24">
          <span
            className="kchar pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-[440px] leading-none opacity-[0.05] select-none"
            lang="ja"
            aria-hidden
          >
            学
          </span>

          <p className="jp text-base font-medium text-primary" lang="ja">
            日本語能力試験 N2
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Systematic JLPT N2 preparation, in one place.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] text-muted-foreground sm:text-base">
            Kanji, vocabulary, and grammar study, timed mock exams, and a
            light-novel reader with tap-to-lookup — all tracked as mastery, not
            just checkmarks.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className={buttonVariants({ size: 'lg', className: 'px-6' })}
            >
              Sign in
            </Link>
            <p className="text-xs text-muted-foreground">
              Accounts are provisioned by your administrator.
            </p>
          </div>
        </section>

        <section aria-label="Features" className="pb-16 sm:pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.label}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span
                      className="jps grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-[17px] font-semibold text-accent-foreground"
                      aria-hidden
                    >
                      {'glyph' in feature ? (
                        <span lang="ja">{feature.glyph}</span>
                      ) : (
                        <feature.icon className="size-[18px]" strokeWidth={1.8} />
                      )}
                    </span>
                    <CardTitle className="text-[15px]">
                      {feature.label}
                      {'jpLabel' in feature ? (
                        <span
                          className="jp ml-2 font-normal text-muted-foreground"
                          lang="ja"
                        >
                          {feature.jpLabel}
                        </span>
                      ) : null}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {'stat' in feature ? (
                    <p className="text-sm font-semibold text-primary">
                      {feature.stat}
                    </p>
                  ) : null}
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-6 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-8 sm:text-left">
          <p className="flex items-center gap-1.5">
            <TrendingUp className="size-3.5" strokeWidth={1.8} aria-hidden />
            Progress and mastery tracking across every module.
          </p>
          <p>JLPT N2 Study — a personal study project.</p>
        </div>
      </footer>
    </div>
  )
}
