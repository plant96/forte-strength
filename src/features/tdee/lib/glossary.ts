import type { GlossaryEntry } from "@/lib/breakdown/types"

import { ACTIVITY_MODEL } from "./activity"
import { INPUT_LIMITS } from "./constants"

export type { GlossaryEntry }

const { weight, heightCm, age, bodyFat, steps, sessions } = INPUT_LIMITS
const { stepCap, sessionCap, stepMax, trainingMax, overlapMax, multiplierMin, multiplierMax } =
  ACTIVITY_MODEL
const n = (value: number) => value.toLocaleString("en-US")

/** Every symbol used in the calculation, in the order they appear. */
export const GLOSSARY = {
  W: {
    tex: "W",
    text: "W",
    name: "Body weight",
    unit: "kg",
    range: `${weight.kg.min}–${weight.kg.max} kg`,
    meaning: "Your bodyweight in kilograms. Pounds are converted with 1 lb = 0.45359237 kg.",
  },
  H: {
    tex: "H",
    text: "H",
    name: "Height",
    unit: "cm",
    range: `${heightCm.min}–${heightCm.max} cm`,
    meaning: "Your height in centimetres. Feet and inches are converted with 1 in = 2.54 cm.",
  },
  A: {
    tex: "A",
    text: "A",
    name: "Age",
    unit: "years",
    range: `${age.min}–${age.max}`,
    meaning: "Your age in whole years.",
  },
  BF: {
    tex: "BF",
    text: "BF",
    name: "Body fat",
    unit: "%",
    range: `${bodyFat.min}–${bodyFat.max}%`,
    meaning: "Your estimated body fat percentage.",
  },
  LBM: {
    tex: "\\text{LBM}",
    text: "LBM",
    name: "Lean body mass",
    unit: "kg",
    range: "—",
    meaning: "Everything that isn't fat (muscle, bone, organs, water): W × (1 − BF/100).",
  },
  BMR: {
    tex: "\\text{BMR}",
    text: "BMR",
    name: "Basal metabolic rate",
    unit: "kcal/day",
    range: "—",
    meaning:
      "Energy your body burns at complete rest. Here it's the average of three published equations.",
  },
  P: {
    tex: "P",
    text: "P",
    name: "Daily steps",
    unit: "steps/day",
    range: `${n(steps.min)}–${n(steps.max)}`,
    meaning: `Your average daily step count. Only the first ${n(stepCap)} count.`,
  },
  x: {
    tex: "x",
    text: "x",
    name: "Step ratio",
    unit: "—",
    range: "0–1",
    meaning: `Your steps as a fraction of the ${n(stepCap)}-step cap.`,
  },
  S: {
    tex: "S",
    text: "S",
    name: "Step component",
    unit: "—",
    range: `0–${stepMax.toFixed(2)}`,
    meaning:
      "How much walking and general movement add to the multiplier. Early steps count more than later ones.",
  },
  F: {
    tex: "F",
    text: "F",
    name: "Training sessions",
    unit: "per week",
    range: `${sessions.min}–${sessions.max}`,
    meaning: `Structured training sessions per week. Only the first ${sessionCap} count.`,
  },
  f: {
    tex: "f",
    text: "f",
    name: "Frequency ratio",
    unit: "—",
    range: "0–1",
    meaning: `Your sessions as a fraction of the ${sessionCap}-session cap.`,
  },
  I: {
    tex: "I",
    text: "I",
    name: "Intensity score",
    unit: "—",
    range: "0–1",
    meaning: "How hard your sessions are, from 0 (no training) to 1 (very hard).",
  },
  q: {
    tex: "q",
    text: "q",
    name: "Training load",
    unit: "—",
    range: "0–1",
    meaning: "Frequency and intensity combined: f × I.",
  },
  T: {
    tex: "T",
    text: "T",
    name: "Training component",
    unit: "—",
    range: `0–${trainingMax.toFixed(2)}`,
    meaning: "How much training adds to the multiplier, with diminishing returns.",
  },
  D: {
    tex: "D",
    text: "D",
    name: "Overlap correction",
    unit: "—",
    range: `0–${overlapMax.toFixed(2)}`,
    meaning:
      "A small deduction that only matters when both steps and training are high, so the two aren't double-counted.",
  },
  M: {
    tex: "M",
    text: "M",
    name: "Activity multiplier",
    unit: "—",
    range: `${multiplierMin.toFixed(2)}–${multiplierMax.toFixed(2)}`,
    meaning: "Scales BMR up to your total daily energy expenditure.",
  },
  TDEE: {
    tex: "\\text{TDEE}",
    text: "TDEE",
    name: "Total daily energy expenditure",
    unit: "kcal/day",
    range: "—",
    meaning: "The calories you burn per day, i.e. your maintenance intake.",
  },
  DD: {
    tex: "DD",
    text: "DD",
    name: "Desired weekly change",
    unit: "lb/week",
    range: "—",
    meaning: "How fast you want to gain (bulk) or lose (cut) weight. kg rates are converted to lb.",
  },
  Delta: {
    tex: "\\Delta",
    text: "Δ",
    name: "Daily calorie adjustment",
    unit: "kcal/day",
    range: "—",
    meaning:
      "Calories added (bulk) or removed (cut) each day, using 3,500 kcal per lb of body mass.",
  },
  E: {
    tex: "E",
    text: "E",
    name: "Calorie target",
    unit: "kcal/day",
    range: "—",
    meaning: "The daily calories the macros are built from: maintenance, or a bulk/cut target.",
  },
  s: {
    tex: "s",
    text: "s",
    name: "Macro share",
    unit: "—",
    range: "0–1",
    meaning: "A macro's share of total calories, e.g. 27.5% = 0.275.",
  },
  k: {
    tex: "k",
    text: "k",
    name: "Energy per gram",
    unit: "kcal/g",
    range: "4 or 9",
    meaning: "4 kcal per gram for protein and carbs, 9 kcal per gram for fat.",
  },
  g: {
    tex: "g",
    text: "g",
    name: "Grams per day",
    unit: "g",
    range: "—",
    meaning: "How many grams of that macro to eat each day.",
  },
} as const satisfies Record<string, GlossaryEntry>

export type SymbolId = keyof typeof GLOSSARY

export const GLOSSARY_ORDER = Object.keys(GLOSSARY) as SymbolId[]
