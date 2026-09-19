import { clamp } from "@/lib/units"

import { formatNumber, type Gauge as GaugeData } from "../../lib/formulas"

/** Shows where a value sits inside its allowed range. */
export function Gauge({ gauge, label }: { gauge: GaugeData; label: string }) {
  const { value, min, max, decimals } = gauge
  const fraction = clamp((value - min) / (max - min), 0, 1)
  const percent = Math.round(fraction * 100)

  return (
    <div className="px-4 pb-4">
      <div
        role="meter"
        aria-label={`${label}: ${percent}% of its range`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-primary/70 to-highlight"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-muted-foreground tabular-nums">
        <span>{formatNumber(min, decimals)}</span>
        <span>{percent}% of range</span>
        <span>{formatNumber(max, decimals)}</span>
      </div>
    </div>
  )
}
