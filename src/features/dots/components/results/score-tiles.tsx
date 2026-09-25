import { CalendarClockIcon, GlobeIcon, type LucideIcon } from "lucide-react"
import { m } from "motion/react"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { popInVariants } from "@/components/motion/variants"
import { formatNumber } from "@/lib/breakdown/format"

import type { DotsResult } from "../../lib/dots"

/** The two companion scores, side by side under the DOTS hero. */
export function ScoreTiles({ result }: { result: DotsResult }) {
  const { age, glp } = result

  return (
    <ul className="grid grid-cols-2 gap-3">
      <m.li variants={popInVariants}>
        <ScoreTile
          Icon={CalendarClockIcon}
          label="Age-adjusted DOTS"
          value={age.adjustedScore}
          caption={`× ${formatNumber(age.coefficient, 3)} age coefficient`}
        />
      </m.li>
      <m.li variants={popInVariants}>
        <ScoreTile Icon={GlobeIcon} label="GLP" value={glp.score} caption="IPF GL points" />
      </m.li>
    </ul>
  )
}

interface ScoreTileProps {
  Icon: LucideIcon
  label: string
  value: number
  caption: string
}

function ScoreTile({ Icon, label, value, caption }: ScoreTileProps) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
        <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-highlight">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        {label}
      </span>
      <span className="font-heading text-3xl leading-none font-bold sm:text-4xl">
        <AnimatedNumber value={value} decimals={2} />
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{caption}</span>
    </div>
  )
}
