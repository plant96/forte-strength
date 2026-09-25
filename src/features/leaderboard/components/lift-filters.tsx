"use client"

import { cn } from "cn"
import { WandSparklesIcon } from "lucide-react"
import { m } from "motion/react"

import { SELECT_TRIGGER_CLASS } from "@/components/forms/section-legend"
import { spring } from "@/components/motion/variants"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  COMPETITION_LIFT_LABELS,
  COMPETITION_LIFTS,
  type CompetitionLift,
} from "@/features/pr-tracker/lib/lifts"

import {
  AGE_GROUPS,
  WEIGHT_CLASSES,
  type AgeGroupId,
  type LiftFilters as Filters,
  type WeightClassId,
} from "../lib/groups"

interface LiftFiltersProps {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onGenerate: () => void
  hasGenerated: boolean
  /** The generate button, so a burst of sparks can start from it. */
  buttonRef?: React.Ref<HTMLButtonElement>
}

/** Lift, age group and weight class, then a button to build the board. */
export function LiftFilters({
  filters,
  onChange,
  onGenerate,
  hasGenerated,
  buttonRef,
}: LiftFiltersProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onGenerate()
      }}
      className="flex flex-col"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <Label id="lift-filter-label">Lift</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={filters.lift}
            onValueChange={(next) => {
              if (next) onChange({ lift: next as CompetitionLift })
            }}
            aria-labelledby="lift-filter-label"
            className="w-full"
          >
            {COMPETITION_LIFTS.map((lift) => (
              <ToggleGroupItem
                key={lift}
                value={lift}
                className="h-10 flex-1 font-heading text-sm font-semibold tracking-wider uppercase data-[state=on]:border-primary/60 data-[state=on]:bg-primary/15 data-[state=on]:text-foreground"
              >
                {COMPETITION_LIFT_LABELS[lift]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lift-filter-age-group">Age group</Label>
            <Select
              value={filters.ageGroup}
              onValueChange={(next) => onChange({ ageGroup: next as AgeGroupId })}
            >
              <SelectTrigger
                id="lift-filter-age-group"
                className={cn("w-full", SELECT_TRIGGER_CLASS)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {AGE_GROUPS.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lift-filter-weight-class">Weight class</Label>
            <Select
              value={filters.weightClass}
              onValueChange={(next) => onChange({ weightClass: next as WeightClassId })}
            >
              <SelectTrigger
                id="lift-filter-weight-class"
                className={cn("w-full", SELECT_TRIGGER_CLASS)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {WEIGHT_CLASSES.map((weightClass) => (
                  <SelectItem key={weightClass.id} value={weightClass.id}>
                    {weightClass.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border p-5 sm:p-6">
        <m.div whileTap={{ scale: 0.985 }} transition={spring}>
          <Button
            ref={buttonRef}
            type="submit"
            size="lg"
            className="h-12 w-full font-heading text-base font-semibold tracking-wider uppercase"
          >
            <WandSparklesIcon />
            Generate leaderboard
          </Button>
        </m.div>
        {hasGenerated && (
          <p className="text-center text-xs text-muted-foreground">
            Results now update as you change the filters.
          </p>
        )}
      </div>
    </form>
  )
}
