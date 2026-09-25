import { cn } from "cn"

import type { MedalTone } from "./rank-badge"

const TONES: Record<MedalTone | "default", string> = {
  default: "bg-primary/15 text-highlight ring-primary/30",
  gold: "bg-gold/15 text-gold ring-gold/40",
  silver: "bg-silver/15 text-silver ring-silver/40",
  bronze: "bg-bronze/15 text-bronze ring-bronze/40",
}

interface InitialsTileProps {
  initials: string
  tone?: MedalTone | "default"
  size?: "sm" | "lg"
  className?: string
}

/** The lifter's initials in place of a photo; the name sits beside it, so this is decorative. */
export function InitialsTile({
  initials,
  tone = "default",
  size = "sm",
  className,
}: InitialsTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl font-heading font-bold ring-1",
        size === "lg" ? "size-14 text-2xl" : "size-10 text-lg",
        TONES[tone],
        className,
      )}
    >
      {initials}
    </span>
  )
}
