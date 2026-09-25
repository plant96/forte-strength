import type { LucideIcon } from "lucide-react"

interface BoardEmptyStateProps {
  icon: LucideIcon
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

/** A board with nothing to rank yet: an icon, a line on why, and sometimes a way to fix it. */
export function BoardEmptyState({ icon: Icon, title, children, action }: BoardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-highlight ring-1 ring-primary/30">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-xl font-bold uppercase">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
      </div>
      {action}
    </div>
  )
}
