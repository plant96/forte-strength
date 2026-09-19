import type { Macro } from "./macros"

/**
 * Thermic effect of food (TEF): energy spent digesting, absorbing and processing food.
 * The calculator does not add it to TDEE, because it depends on each athlete's diet.
 * These values only power the explanation.
 */

/** Typical TEF of each macro, as a percent of that macro's own calories. */
export const TEF_BY_MACRO = {
  protein: { min: 20, max: 30 },
  carbs: { min: 5, max: 10 },
  fat: { min: 0, max: 3 },
} as const satisfies Record<Macro, { min: number; max: number }>

export const TEF_SOURCE =
  "Westerterp KR. Diet induced thermogenesis. Nutr Metab (Lond). 2004;1(1):5."

export const TEF_NOTE =
  "Not included: the thermic effect of food (TEF). These numbers cover BMR and activity (NEAT and EAT) only. Digesting food burns calories too, and how many depends on what you eat, so your actual daily burn may be slightly higher."
