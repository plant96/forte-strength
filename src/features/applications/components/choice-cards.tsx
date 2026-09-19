"use client"

import { cn } from "cn"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ChoiceCardsProps {
  name: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: readonly { value: string; label: string }[]
  labelledBy: string
  invalid?: boolean
  columns?: 1 | 2
}

/** A radio group shown as tappable cards. */
export function ChoiceCards({
  name,
  value,
  onChange,
  onBlur,
  options,
  labelledBy,
  invalid,
  columns = 1,
}: ChoiceCardsProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      onBlur={onBlur}
      aria-labelledby={labelledBy}
      aria-invalid={invalid}
      className={cn("gap-2", columns === 2 && "sm:grid-cols-2")}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl bg-background/50 p-4 text-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted/40",
              "has-data-checked:bg-primary/10 has-data-checked:ring-primary/60",
              invalid && "ring-destructive/50",
            )}
          >
            <RadioGroupItem id={id} value={option.value} className="mt-0.5" />
            <span className="leading-snug">{option.label}</span>
          </label>
        )
      })}
    </RadioGroup>
  )
}
