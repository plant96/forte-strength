"use client"

import { cn } from "cn"
import { BookOpenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { SELECTABLE_INTENSITY_LEVELS, STEP_OVERLAP_NOTE, type IntensityId } from "../lib/constants"

/** A written guide to the intensity levels. Highlights the level the user picked. */
export function IntensityReferenceDialog({ selected }: { selected: IntensityId | null }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 shrink-0">
          <BookOpenIcon />
          Reference
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="font-heading text-xl font-bold tracking-wide uppercase">
            Training intensity guide
          </DialogTitle>
          <DialogDescription>
            Pick the level that best matches most of your weekly sessions.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-2.5">
          {SELECTABLE_INTENSITY_LEVELS.map((level, index) => {
            const isSelected = level.id === selected
            return (
              <li
                key={level.id}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "flex flex-col gap-3 rounded-xl bg-background/50 p-4 ring-1 ring-foreground/10",
                  isSelected && "bg-primary/10 ring-primary/50",
                )}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <IntensityBars filled={index + 1} total={SELECTABLE_INTENSITY_LEVELS.length} />
                  <h3 className="font-heading text-lg leading-none font-bold uppercase">
                    {level.label}
                  </h3>
                  {isSelected && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[0.7rem] font-medium text-highlight">
                      Your selection
                    </span>
                  )}
                </div>
                <ul className="flex flex-wrap gap-1.5" aria-label={`${level.label} examples`}>
                  {level.examples.map((example) => (
                    <li
                      key={example}
                      className="rounded-full bg-muted/70 px-2.5 py-1 text-xs text-foreground/90"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>

        <div className="flex flex-col gap-2">
          <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Walking and your step count: </span>
            {STEP_OVERLAP_NOTE}
          </p>
          <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">Heart-rate zones: </span>
            Zone 3 is roughly 70–80% of your max heart rate (you can speak in short sentences). Zone
            4 is roughly 80–90% (only a few words at a time).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Five ascending bars with the first `filled` lit, as a quick visual of the level. */
function IntensityBars({ filled, total }: { filled: number; total: number }) {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn("w-1.5 rounded-sm", index < filled ? "bg-primary" : "bg-muted")}
          style={{ height: `${((index + 1) / total) * 100}%` }}
        />
      ))}
    </span>
  )
}
