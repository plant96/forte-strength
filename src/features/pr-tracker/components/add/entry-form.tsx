"use client"

import { cn } from "cn"
import { Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { DateField } from "@/components/forms/date-field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parseNumberInput } from "@/lib/forms/reader"
import { roundTo, type WeightUnit } from "@/lib/units"

import { addPrEntry, setLiftUnit, type AddEntryOutcome } from "../../actions"
import { describeDay, formatDay, isDay, today } from "@/lib/day"
import { currentRecord } from "../../lib/records"
import { seriesTitle, type SeriesShape } from "../../lib/series"
import { formatWeight, fromKg, toKg, WEIGHT_LIMITS } from "../../lib/weight"
import type { ExerciseSummary, SeriesView } from "../../queries"

/**
 * The last step: what you lifted, and when.
 *
 * The record to beat is shown while they type, and the submit button says what will
 * happen — "Log 195 lb, a 10 lb PR" — so the rule that a record must beat the one before
 * it is visible before they press anything rather than arriving as a refusal afterwards.
 */

interface EntryFormProps {
  exercise: ExerciseSummary
  shape: SeriesShape
  series: SeriesView | null
  unit: WeightUnit
  athleteId?: string
  onLogged: (outcome: AddEntryOutcome) => void
  onUnitChange: (unit: WeightUnit) => void
}

export function EntryForm({
  exercise,
  shape,
  series,
  unit,
  athleteId,
  onLogged,
  onUnitChange,
}: EntryFormProps) {
  const [weight, setWeight] = useState("")
  const [day, setDay] = useState(today())
  const [error, setError] = useState<{ field: string | null; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const record = currentRecord(series?.entries ?? [])
  const typed = parseNumberInput(weight)
  const limits = WEIGHT_LIMITS[unit]
  const inRange = typed !== null && typed >= limits.min && typed <= limits.max
  const dayChosen = isDay(day)
  const gainKg = inRange && record ? toKg(typed, unit) - record.weightKg : null

  function changeUnit(next: WeightUnit) {
    if (next === unit) return
    // Convert what they have already typed, so switching units never silently changes the
    // number's meaning.
    if (typed !== null) {
      const converted = next === "kg" ? roundTo(toKg(typed, "lb"), 1) : fromKg(typed, "lb")
      setWeight(String(converted))
    }
    onUnitChange(next)
    // Only the lifter's own preference is persisted. A coach switching units to read a
    // client's numbers should not have that stick to their own account.
    if (!athleteId) void setLiftUnit(next)
  }

  function submit() {
    if (typed === null) {
      setError({ field: "weight", message: "Enter the weight you lifted" })
      return
    }
    if (!isDay(day)) {
      setError({ field: "achievedOn", message: "Pick the day you hit it" })
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await addPrEntry({
        exerciseId: exercise.id,
        kind: shape.kind,
        sets: shape.sets,
        reps: shape.reps,
        weight: typed,
        unit,
        achievedOn: day,
        athleteId,
      })

      if (!result.ok) {
        setError({ field: result.field, message: result.message })
        return
      }
      toast.success("Record logged")
      onLogged(result.data)
    })
  }

  const buttonLabel = !inRange
    ? "Log this record"
    : !record
      ? `Log ${typed} ${unit} as your baseline`
      : gainKg !== null && gainKg > 0
        ? `Log ${typed} ${unit} — a ${formatWeight(gainKg, unit)} PR`
        : `Log ${typed} ${unit}`

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 @md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pr-weight" className="text-sm font-medium">
            Weight
          </label>
          <div className="flex gap-2">
            <Input
              id="pr-weight"
              inputMode="decimal"
              autoComplete="off"
              value={weight}
              onChange={(event) => {
                setWeight(event.target.value)
                setError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !pending) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder={unit === "kg" ? "102.5" : "225"}
              aria-invalid={error?.field === "weight" || undefined}
              className="h-12 flex-1 text-base"
            />
            <ToggleGroup
              type="single"
              value={unit}
              onValueChange={(next) => next && changeUnit(next as WeightUnit)}
              aria-label="Weight unit"
              className="h-12"
            >
              <ToggleGroupItem value="lb" className="px-4">
                lb
              </ToggleGroupItem>
              <ToggleGroupItem value="kg" className="px-4">
                kg
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pr-day" className="text-sm font-medium">
            Date
          </label>
          <DateField
            id="pr-day"
            value={day}
            max={today()}
            onChange={(next) => {
              setDay(next)
              setError(null)
            }}
            // Opening the calendar cleared the day, so closing it without one leaves the
            // record undated. Say so, rather than leaving a disabled button to explain itself.
            onDismiss={() =>
              setError({
                field: "achievedOn",
                message: "Pick the day you hit it — tap a date on the calendar",
              })
            }
            invalid={error?.field === "achievedOn"}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {record ? (
            <>
              Your {seriesTitle(exercise.name, shape).toLowerCase()} record is{" "}
              <span className="font-medium text-foreground">
                {formatWeight(record.weightKg, unit)}
              </span>
              , set {describeDay(record.achievedOn)}. Beat it to log a new one.
            </>
          ) : (
            <>Nothing logged here yet — whatever you enter becomes your baseline.</>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !inRange || !dayChosen}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-lg bg-primary font-heading text-sm font-semibold tracking-wider text-primary-foreground uppercase transition-all",
          "hover:bg-primary/85 disabled:pointer-events-none disabled:opacity-45",
        )}
      >
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        {buttonLabel}
      </button>

      {dayChosen && day !== today() && (
        <p className="text-xs text-muted-foreground">
          Logging for {formatDay(day)}. A back-dated record still has to keep the line climbing —
          heavier than the one before it, lighter than the one after.
        </p>
      )}
    </div>
  )
}
