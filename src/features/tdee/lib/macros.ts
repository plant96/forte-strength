import { formatRate, type GoalDirection, type GoalTargets } from "./goals"

export type Macro = "protein" | "carbs" | "fat"

/** Display order, also the order of segments in the split bar. */
export const MACROS = ["protein", "carbs", "fat"] as const satisfies readonly Macro[]

export const MACRO_INFO = {
  protein: { label: "Protein", kcalPerGram: 4 },
  carbs: { label: "Carbs", kcalPerGram: 4 },
  fat: { label: "Fat", kcalPerGram: 9 },
} as const satisfies Record<Macro, { label: string; kcalPerGram: number }>

export interface MacroSplit {
  id: "standard" | "high-protein" | "high-carb"
  name: string
  tagline: string
  /** Share of calories per macro, in percent. Always sums to 100. */
  percent: Record<Macro, number>
  coachFavorite?: boolean
}

export const MACRO_SPLITS: readonly MacroSplit[] = [
  {
    id: "standard",
    name: "Standard",
    tagline: "A balanced split for most lifters.",
    percent: { protein: 27.5, carbs: 45, fat: 27.5 },
  },
  {
    id: "high-protein",
    name: "High protein",
    tagline: "More protein, less fat.",
    percent: { protein: 37.5, carbs: 42.5, fat: 20 },
  },
  {
    id: "high-carb",
    name: "High carb",
    tagline: "The most fuel for hard training.",
    percent: { protein: 25, carbs: 55, fat: 20 },
    coachFavorite: true,
  },
]

export interface MacroAmount {
  macro: Macro
  percent: number
  kcal: number
  grams: number
}

/** grams = calories × share ÷ kcal per gram */
export function calculateMacros(calories: number, split: MacroSplit): MacroAmount[] {
  return MACROS.map((macro) => {
    const percent = split.percent[macro]
    const kcal = (calories * percent) / 100
    return { macro, percent, kcal, grams: kcal / MACRO_INFO[macro].kcalPerGram }
  })
}

// ---------------------------------------------------------------------------
// Which calorie target the macros are built from
// ---------------------------------------------------------------------------

export type CalorieTargetId = "maintenance" | `${GoalDirection}-${number}`

export interface CalorieTarget {
  id: CalorieTargetId
  /** e.g. "Maintenance" or "Cut −0.5 lb/week". */
  label: string
  calories: number
}

export function listCalorieTargets(tdee: number, goals: GoalTargets) {
  const fromGoals = (direction: GoalDirection) =>
    goals[direction].map((target, index): CalorieTarget => ({
      id: `${direction}-${index}`,
      label: `${direction === "cut" ? "Cut" : "Bulk"} ${formatRate(target)}`,
      calories: target.calories,
    }))

  return {
    maintenance: { id: "maintenance", label: "Maintenance", calories: tdee } as CalorieTarget,
    cut: fromGoals("cut"),
    bulk: fromGoals("bulk"),
  }
}

/** Resolves a target id, falling back to maintenance if it no longer exists. */
export function resolveCalorieTarget(
  id: CalorieTargetId,
  tdee: number,
  goals: GoalTargets,
): CalorieTarget {
  const targets = listCalorieTargets(tdee, goals)
  return [...targets.cut, ...targets.bulk].find((target) => target.id === id) ?? targets.maintenance
}
