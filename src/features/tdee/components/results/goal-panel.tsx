import { cn } from "cn"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { m } from "motion/react"

import type { GoalDirection, GoalTarget } from "../../lib/goals"
import { goalTileVariants } from "./animations"
import { GoalOption } from "./goal-option"

const PANEL_STYLES = {
  bulk: {
    title: "Bulk",
    description: "Daily calories to gain weight",
    Icon: TrendingUpIcon,
    panel: "from-bulk/12 ring-bulk/25",
    badge: "bg-bulk/15 text-bulk",
  },
  cut: {
    title: "Cut",
    description: "Daily calories to lose weight",
    Icon: TrendingDownIcon,
    panel: "from-cut/12 ring-cut/25",
    badge: "bg-cut/15 text-cut",
  },
} as const

interface GoalPanelProps {
  direction: GoalDirection
  targets: GoalTarget[]
}

export function GoalPanel({ direction, targets }: GoalPanelProps) {
  const styles = PANEL_STYLES[direction]
  const headingId = `${direction}-heading`

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "@container rounded-xl bg-card bg-linear-to-b to-transparent p-4 ring-1",
        styles.panel,
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className={cn("grid size-9 place-items-center rounded-lg", styles.badge)}>
          <styles.Icon className="size-5" />
        </span>
        <div>
          <h3 id={headingId} className="font-heading text-lg leading-tight font-bold uppercase">
            {styles.title}
          </h3>
          <p className="text-xs text-muted-foreground">{styles.description}</p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 @md:grid-cols-4">
        {targets.map((target, index) => (
          // Index keys keep tiles mounted when switching lb/kg, so numbers tween instead of re-entering.
          <m.li key={index} variants={goalTileVariants}>
            <GoalOption target={target} />
          </m.li>
        ))}
      </ul>
    </section>
  )
}
