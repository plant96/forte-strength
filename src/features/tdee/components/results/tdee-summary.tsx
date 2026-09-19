import { AnimatedNumber } from "@/components/motion/animated-number"

import type { TdeeResult } from "../../lib/tdee"

export function TdeeSummary({ result }: { result: TdeeResult }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card ring-1 ring-primary/35">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-3/4 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-1 px-6 pt-6 pb-5 text-center">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          Maintenance (TDEE)
        </p>
        <p className="font-heading text-6xl leading-none font-bold sm:text-7xl">
          <AnimatedNumber value={result.tdee} from={0} />
        </p>
        <p className="text-sm text-muted-foreground">kcal per day</p>
      </div>
      <dl className="relative grid grid-cols-2 divide-x divide-border border-t border-border text-center">
        <div className="flex flex-col gap-0.5 px-3 py-3">
          <dt className="text-xs text-muted-foreground">BMR (average of 3)</dt>
          <dd className="text-sm font-semibold">
            <AnimatedNumber value={result.bmr.average} /> kcal
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 px-3 py-3">
          <dt className="text-xs text-muted-foreground">Activity multiplier</dt>
          <dd className="text-sm font-semibold">
            × <AnimatedNumber value={result.activity.multiplier} decimals={3} />
          </dd>
        </div>
      </dl>
      <p className="sr-only" aria-live="polite">
        Estimated TDEE: {Math.round(result.tdee).toLocaleString("en-US")} calories per day.
      </p>
    </div>
  )
}
