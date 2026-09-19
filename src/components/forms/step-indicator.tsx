"use client"

import { cn } from "cn"
import { CheckIcon } from "lucide-react"

import { Progress } from "@/components/ui/progress"

interface StepIndicatorProps {
  steps: readonly { id: string; title: string }[]
  stepIndex: number
  /** Furthest step reached; earlier steps can be revisited. */
  highestStep: number
  onSelect: (index: number) => void
  label?: string
}

/** Progress bar plus numbered, clickable steps for multi-step forms. */
export function StepIndicator({
  steps,
  stepIndex,
  highestStep,
  onSelect,
  label = "Progress",
}: StepIndicatorProps) {
  const progress = ((stepIndex + 1) / steps.length) * 100

  return (
    <nav aria-label={label} className="flex flex-col gap-3">
      <Progress value={progress} className="h-1.5" aria-label={label} />
      <ol
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((item, index) => {
          const done = index < stepIndex
          const current = index === stepIndex
          const reachable = index <= highestStep
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (reachable) onSelect(index)
                }}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-xs transition-colors disabled:cursor-default sm:text-sm",
                  current ? "text-foreground" : "text-muted-foreground",
                  reachable && !current && "hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full font-heading text-xs font-bold ring-1",
                    current && "bg-primary text-primary-foreground ring-primary",
                    done && "bg-primary/15 text-highlight ring-primary/40",
                    !current && !done && "ring-foreground/15",
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : index + 1}
                </span>
                <span className="hidden truncate font-medium sm:inline">{item.title}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
