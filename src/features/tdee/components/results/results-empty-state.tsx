import { FlameIcon } from "lucide-react"

export function ResultsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center lg:min-h-96">
      <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <FlameIcon className="size-6" />
      </div>
      <p className="font-heading text-lg font-semibold tracking-wide uppercase">
        Your results will appear here
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Fill in your stats and press <span className="text-foreground">Calculate TDEE</span> to see
        your maintenance calories, plus daily targets to bulk or cut.
      </p>
    </div>
  )
}
