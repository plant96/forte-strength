import { cn } from "cn"
import { CrownIcon, MedalIcon, type LucideIcon } from "lucide-react"

export type MedalTone = "gold" | "silver" | "bronze"

const MEDALS: Record<MedalTone, { Icon: LucideIcon; className: string }> = {
  gold: { Icon: CrownIcon, className: "bg-gold/15 text-gold ring-gold/40" },
  silver: { Icon: MedalIcon, className: "bg-silver/15 text-silver ring-silver/40" },
  bronze: { Icon: MedalIcon, className: "bg-bronze/15 text-bronze ring-bronze/40" },
}

export function medalFor(rank: number): MedalTone | null {
  return rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : null
}

interface RankBadgeProps {
  rank: number
  size?: "sm" | "lg"
  className?: string
}

/** A medal for the top three, a plain number for everyone else. */
export function RankBadge({ rank, size = "sm", className }: RankBadgeProps) {
  const medal = medalFor(rank)
  const box = size === "lg" ? "size-10" : "size-8"

  if (medal) {
    const { Icon, className: tone } = MEDALS[medal]
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-full ring-1", box, tone, className)}
      >
        <Icon className={size === "lg" ? "size-5" : "size-4"} aria-hidden="true" />
        <span className="sr-only">Rank {rank}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-muted font-heading font-bold text-muted-foreground tabular-nums ring-1 ring-foreground/10",
        box,
        size === "lg" ? "text-lg" : "text-sm",
        className,
      )}
    >
      <span aria-hidden="true">{rank}</span>
      <span className="sr-only">Rank {rank}</span>
    </span>
  )
}
