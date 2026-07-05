export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      {/* Wordmark: vermillion seal + JLPT N2 / STUDY (matches the app rail). */}
      <div className="flex items-center gap-3">
        <span className="seal size-10 rounded-[11px] text-[21px] font-semibold" aria-hidden>
          学
        </span>
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-tight">JLPT N2</span>
          <span className="mt-1 block text-[9.5px] font-medium tracking-[0.14em] text-muted-foreground">
            STUDY
          </span>
        </span>
      </div>
      {children}
    </main>
  )
}
