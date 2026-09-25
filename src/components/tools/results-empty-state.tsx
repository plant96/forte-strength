import type { LucideIcon } from "lucide-react"

interface ResultsEmptyStateProps {
  icon: LucideIcon
  title?: string
  /** One sentence on what to do and what will appear. */
  children: React.ReactNode
}

/** The dashed placeholder a calculator shows in its results column before the first run. */
export function ResultsEmptyState({
  icon: Icon,
  title = "Your results will appear here",
  children,
}: ResultsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center lg:min-h-96">
      <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <p className="font-heading text-lg font-semibold tracking-wide uppercase">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
