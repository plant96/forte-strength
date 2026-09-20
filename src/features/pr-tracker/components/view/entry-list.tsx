"use client"

import { Loader2Icon, Trash2Icon, UserRoundCogIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { WeightUnit } from "@/lib/units"

import { deletePrEntry } from "../../actions"
import { describeDay, formatDay } from "../../lib/day"
import { formatWeightValue } from "../../lib/weight"
import type { EntryView } from "../../queries"

/**
 * Every record on a series, newest first.
 *
 * Deleting is deliberately easy to reach. Because a series may only ever climb, one
 * mistyped record — a slipped zero turning 225 into 2250 — would make the series
 * unbeatable forever. Removing it has to be a one-tap fix, not a support request.
 */
export function EntryList({
  entries,
  unit,
  athleteId,
}: {
  entries: EntryView[]
  unit: WeightUnit
  athleteId?: string
}) {
  const [target, setTarget] = useState<EntryView | null>(null)
  const [pending, startTransition] = useTransition()

  const newestFirst = [...entries].reverse()

  function confirmDelete() {
    if (!target) return
    startTransition(async () => {
      const result = await deletePrEntry({ entryId: target.id, athleteId })
      setTarget(null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success("Record removed")
    })
  }

  return (
    <>
      <ul className="flex flex-col">
        {newestFirst.map((entry, index) => {
          // The list runs newest-first, so the "previous" record is the next one down.
          const previous = newestFirst[index + 1]
          const gainKg = previous ? entry.weightKg - previous.weightKg : null

          return (
            <li
              key={entry.id}
              className="group flex items-center gap-4 border-b border-border py-3 last:border-0"
            >
              <span className="w-24 shrink-0 font-medium tabular-nums">
                {formatWeightValue(entry.weightKg, unit)} {unit}
              </span>

              <span className="w-16 shrink-0 text-sm tabular-nums">
                {gainKg !== null && gainKg > 0 ? (
                  <span className="text-chart-4">+{formatWeightValue(gainKg, unit)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm">{formatDay(entry.achievedOn)}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {describeDay(entry.achievedOn)}
                  {index === 0 && <span className="ml-1.5 text-highlight">current record</span>}
                </span>
              </span>

              {entry.byCoach && (
                <span
                  title="Logged by your coach"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-foreground/10"
                >
                  <UserRoundCogIcon className="size-3" />
                  Coach
                </span>
              )}

              <button
                type="button"
                onClick={() => setTarget(entry)}
                aria-label={`Remove the ${formatWeightValue(entry.weightKg, unit)} ${unit} record from ${formatDay(entry.achievedOn)}`}
                className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100"
              >
                <Trash2Icon className="size-4" />
              </button>
            </li>
          )
        })}
      </ul>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {target && (
                <>
                  {formatWeightValue(target.weightKg, unit)} {unit} from{" "}
                  {formatDay(target.achievedOn)} will be deleted, and the graph will redraw without
                  it. This can&apos;t be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
