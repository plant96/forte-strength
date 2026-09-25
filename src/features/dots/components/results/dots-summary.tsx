import { AnimatedNumber } from "@/components/motion/animated-number"
import { formatNumber } from "@/lib/breakdown/format"

import type { DotsResult } from "../../lib/dots"

export function DotsSummary({ result }: { result: DotsResult }) {
  const { dots, age, glp, bodyweight, input } = result

  return (
    <div className="relative overflow-hidden rounded-xl bg-card ring-1 ring-primary/35">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-3/4 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-1 px-6 pt-6 pb-5 text-center">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          DOTS
        </p>
        <p className="font-heading text-6xl leading-none font-bold sm:text-7xl">
          <AnimatedNumber value={dots.score} decimals={2} from={0} />
        </p>
        <p className="text-sm text-muted-foreground">points</p>
      </div>
      <dl className="relative grid grid-cols-2 divide-x divide-border border-t border-border text-center">
        <div className="flex flex-col gap-0.5 px-3 py-3">
          <dt className="text-xs text-muted-foreground">
            Bodyweight{bodyweight.clamped && " (clamped)"}
          </dt>
          <dd className="text-sm font-semibold">
            <AnimatedNumber value={bodyweight.kg} decimals={1} /> kg
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 px-3 py-3">
          <dt className="text-xs text-muted-foreground">Total</dt>
          <dd className="text-sm font-semibold">
            <AnimatedNumber value={input.totalKg} decimals={1} /> kg
          </dd>
        </div>
      </dl>
      <p className="sr-only" aria-live="polite">
        DOTS score: {formatNumber(dots.score, 2)}. Age-adjusted:{" "}
        {formatNumber(age.adjustedScore, 2)}. GLP: {formatNumber(glp.score, 2)}.
      </p>
    </div>
  )
}
