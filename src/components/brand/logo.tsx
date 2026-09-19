import { cn } from "cn"

import { TMark } from "./t-mark"

/** T mark plus the "Forte Strength Systems" wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-lg bg-secondary ring-1 ring-foreground/10">
        <TMark className="size-5 text-foreground" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-heading text-lg font-bold tracking-wide uppercase">
          Forte Strength
        </span>
        <span className="font-heading text-[0.65rem] font-semibold tracking-[0.35em] text-muted-foreground uppercase">
          Systems
        </span>
      </span>
    </span>
  )
}
