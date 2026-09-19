"use client"

import { cn } from "cn"
import { BookOpenIcon, InfoIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { SELECTABLE_INTENSITY_LEVELS, type TrainingIntensityId } from "../lib/constants"

interface IntensityReferenceDialogProps {
  selected: TrainingIntensityId | null
  /** True when the user trains 0 sessions a week, which locks intensity to "No training". */
  disabled: boolean
  onSelect: (id: TrainingIntensityId) => void
}

/** A guide to the intensity levels. Picking a level selects it and closes the guide. */
export function IntensityReferenceDialog({
  selected,
  disabled,
  onSelect,
}: IntensityReferenceDialogProps) {
  const [open, setOpen] = useState(false)

  function choose(id: TrainingIntensityId) {
    onSelect(id)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            {disabled
              ? "Pick the level that best matches most of your weekly sessions."
              : "Pick the level that best matches most of your weekly sessions. Tap one to select it."}
          </DialogDescription>
        </DialogHeader>

        {disabled && (
          <p className="flex items-start gap-2 rounded-lg bg-primary/10 px-4 py-3 text-xs ring-1 ring-primary/25">
            <InfoIcon className="mt-px size-3.5 shrink-0 text-highlight" aria-hidden="true" />
            You train 0 sessions a week, so intensity is set to “No training”. Add sessions to pick
            a level.
          </p>
        )}

        <ol className="flex flex-col gap-2.5">
          {SELECTABLE_INTENSITY_LEVELS.map((level, index) => {
            const isSelected = !disabled && level.id === selected
            return (
              <li key={level.id}>
                <button
                  type="button"
                  onClick={() => choose(level.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full flex-col gap-3 rounded-xl bg-background/50 p-4 text-left ring-1 ring-foreground/10 transition-colors outline-none",
                    "hover:bg-muted/40 hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-ring/60",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-background/50 disabled:hover:ring-foreground/10",
                    isSelected && "bg-primary/10 ring-primary/50 hover:bg-primary/15",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <IntensityBars filled={index + 1} total={SELECTABLE_INTENSITY_LEVELS.length} />
                    <span className="font-heading text-lg leading-none font-bold uppercase">
                      {level.label}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[0.7rem] font-medium text-highlight">
                        Your selection
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {level.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-full bg-muted/70 px-2.5 py-1 text-xs text-foreground/90"
                      >
                        {example}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Heart-rate zones: </span>
          Zone 3 is roughly 70–80% of your max heart rate (you can speak in short sentences). Zone 4
          is roughly 80–90% (only a few words at a time).
        </p>
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
