import { InfoIcon } from "lucide-react"

import { formatNumber } from "@/lib/breakdown/format"

import type { DotsResult } from "../../lib/dots"

/** Shown when the bodyweight fell outside the range DOTS is defined for. */
export function BodyweightNote({ result }: { result: DotsResult }) {
  const { bodyweight, input } = result

  return (
    <p className="flex items-start gap-2.5 rounded-xl bg-muted/25 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-foreground/10">
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground/90">
          DOTS is defined for {bodyweight.range.min}–{bodyweight.range.max} kg.
        </span>{" "}
        Your {formatNumber(input.bodyweightKg, 1)} kg was read as {formatNumber(bodyweight.kg, 1)}{" "}
        kg for the DOTS scores. GLP has no range and uses your bodyweight as entered.
      </span>
    </p>
  )
}
