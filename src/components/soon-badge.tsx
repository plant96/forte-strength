import { cn } from "cn"

/** The small "Soon" pill on a coming-soon teaser, styled like the nav's "Clients" pill. */
export function SoonBadge({ className, label = "Soon" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-highlight uppercase ring-1 ring-primary/30",
        className,
      )}
    >
      {label}
    </span>
  )
}
