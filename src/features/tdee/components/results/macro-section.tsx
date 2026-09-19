"use client"

import { cn } from "cn"
import { StarIcon } from "lucide-react"
import { m, type Variants } from "motion/react"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { GoalTargets } from "../../lib/goals"
import {
  calculateMacros,
  listCalorieTargets,
  MACRO_INFO,
  MACRO_SPLITS,
  type CalorieTarget,
  type CalorieTargetId,
  type Macro,
  type MacroAmount,
  type MacroSplit,
} from "../../lib/macros"

/** Series colors, validated as an adjacent set on the card surface (see globals.css). */
const MACRO_SWATCH: Record<Macro, string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 26, delayChildren: 0.1 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 26 },
  },
}

interface MacroSectionProps {
  tdee: number
  goals: GoalTargets
  target: CalorieTarget
  onTargetChange: (id: CalorieTargetId) => void
}

export function MacroSection({ tdee, goals, target, onTargetChange }: MacroSectionProps) {
  const targets = listCalorieTargets(tdee, goals)
  const kcal = (calories: number) => `${Math.round(calories).toLocaleString("en-US")} kcal`

  return (
    <m.section
      aria-labelledby="macros-heading"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={sectionVariants}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h2
            id="macros-heading"
            className="font-heading text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <span className="text-primary">04</span> Your macros
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Three ways to split your daily calories. Protein and carbs have 4 kcal per gram; fat has
            9.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <Label htmlFor="macro-target" className="text-xs text-muted-foreground">
            Calorie target
          </Label>
          <Select
            value={target.id}
            onValueChange={(next) => onTargetChange(next as CalorieTargetId)}
          >
            <SelectTrigger id="macro-target" className="w-full data-[size=default]:h-10 sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="maintenance">
                Maintenance · {kcal(targets.maintenance.calories)}
              </SelectItem>
              <SelectGroup>
                <SelectLabel>Cut</SelectLabel>
                {targets.cut.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label} · {kcal(option.calories)}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Bulk</SelectLabel>
                {targets.bulk.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label} · {kcal(option.calories)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {MACRO_SPLITS.map((split) => (
          <m.li key={split.id} variants={cardVariants}>
            <MacroCard split={split} calories={target.calories} />
          </m.li>
        ))}
      </ul>
    </m.section>
  )
}

function MacroCard({ split, calories }: { split: MacroSplit; calories: number }) {
  const amounts = calculateMacros(calories, split)
  const headingId = `macro-${split.id}-heading`

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10",
        split.coachFavorite && "bg-linear-to-b from-primary/12 to-transparent ring-primary/45",
      )}
    >
      {/* Sits on the card's top edge so it never pushes the content out of line with the other cards. */}
      {split.coachFavorite && (
        <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[0.7rem] font-semibold text-primary-foreground shadow-lg shadow-primary/25">
          <StarIcon className="size-3 fill-current" aria-hidden="true" />
          Coach Ty&apos;s favorite
        </span>
      )}
      <header className="flex flex-col gap-0.5">
        <h3 id={headingId} className="font-heading text-xl leading-tight font-bold uppercase">
          {split.name}
        </h3>
        <p className="text-sm text-muted-foreground">{split.tagline}</p>
      </header>

      <SplitBar amounts={amounts} />

      <table className="w-full text-sm">
        <caption className="sr-only">
          {split.name} macros at {Math.round(calories).toLocaleString("en-US")} kcal per day
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Macro</th>
            <th scope="col">Share of calories</th>
            <th scope="col">Grams per day</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {amounts.map((amount) => (
            <tr key={amount.macro}>
              <th scope="row" className="py-2.5 text-left font-medium">
                <span className="flex items-center gap-2">
                  <span
                    className={cn("size-2.5 rounded-full", MACRO_SWATCH[amount.macro])}
                    aria-hidden="true"
                  />
                  {MACRO_INFO[amount.macro].label}
                </span>
              </th>
              <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                {amount.percent}%
              </td>
              <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                <span className="font-heading text-2xl leading-none font-bold tabular-nums">
                  <AnimatedNumber value={amount.grams} />
                </span>
                <span className="ml-0.5 text-xs text-muted-foreground">g</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

/** Part-to-whole bar: one segment per macro, sized by share of calories, 2px surface gaps. */
function SplitBar({ amounts }: { amounts: MacroAmount[] }) {
  const summary = amounts
    .map((amount) => `${MACRO_INFO[amount.macro].label} ${amount.percent}%`)
    .join(", ")

  return (
    <div className="flex h-3 gap-0.5" role="img" aria-label={`Calorie split: ${summary}`}>
      {amounts.map((amount) => (
        <div
          key={amount.macro}
          title={`${MACRO_INFO[amount.macro].label}: ${amount.percent}% · ${Math.round(amount.grams)} g`}
          className={cn(
            "h-full basis-0 transition-[filter] first:rounded-l-[4px] last:rounded-r-[4px] hover:brightness-125",
            MACRO_SWATCH[amount.macro],
          )}
          style={{ flexGrow: amount.percent }}
        />
      ))}
    </div>
  )
}
