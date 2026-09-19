import { cn } from "cn"

import { AnimatedNumber } from "@/components/motion/animated-number"

import type { GoalTarget } from "../../lib/goals"

const MINUS = "−"

export function GoalOption({ target }: { target: GoalTarget }) {
  const isBulk = target.direction === "bulk"
  const sign = isBulk ? "+" : MINUS
  const rate = target.rate.toLocaleString("en-US", { maximumFractionDigits: 2 })
  const delta = Math.round(target.dailyDelta).toLocaleString("en-US")

  return (
    <div className="flex h-full flex-col gap-1 rounded-lg bg-background/60 p-3 ring-1 ring-foreground/10">
      <span className={cn("text-xs font-semibold tabular-nums", isBulk ? "text-bulk" : "text-cut")}>
        {sign}
        {rate} {target.unit}/week
      </span>
      <span className="font-heading text-3xl leading-none font-bold">
        <AnimatedNumber value={target.calories} />
      </span>
      <span className="text-xs text-muted-foreground">kcal/day</span>
      <span className="mt-auto pt-1 text-xs text-muted-foreground tabular-nums">
        {sign}
        {delta} kcal
      </span>
      {target.belowBmr && (
        <span
          className="mt-1 w-fit rounded-full bg-destructive/15 px-2 py-0.5 text-[0.7rem] font-medium text-destructive"
          title="This target is below your BMR. A slower rate is easier to sustain."
        >
          Below BMR
        </span>
      )}
    </div>
  )
}
