"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { WeightUnit } from "@/lib/units"

interface UnitToggleProps {
  value: WeightUnit
  onChange: (unit: WeightUnit) => void
}

/** lb / kg for every weight on the page. */
export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as WeightUnit)
      }}
      aria-label="Weight unit"
    >
      <ToggleGroupItem value="lb" className="px-3 data-[state=on]:bg-primary/15">
        lb
      </ToggleGroupItem>
      <ToggleGroupItem value="kg" className="px-3 data-[state=on]:bg-primary/15">
        kg
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
