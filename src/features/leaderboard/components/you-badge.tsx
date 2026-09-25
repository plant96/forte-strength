import { Badge } from "@/components/ui/badge"

/** Marks the signed-in lifter's own row. */
export function YouBadge() {
  return (
    <Badge variant="outline" className="border-primary/40 text-highlight">
      You
    </Badge>
  )
}
