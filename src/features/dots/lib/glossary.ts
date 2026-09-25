import type { GlossaryEntry } from "@/lib/breakdown/types"

import { AGE_COEFFICIENT_TABLE } from "./age-coefficient"
import { DOTS_BODYWEIGHT_RANGE_KG, DOTS_INPUT_LIMITS } from "./constants"

const { male, female } = DOTS_BODYWEIGHT_RANGE_KG
const { total } = DOTS_INPUT_LIMITS
const maxCoefficient = Math.max(...AGE_COEFFICIENT_TABLE.map((row) => row.coefficient))
const n = (value: number) => value.toLocaleString("en-US")

/** Every symbol used in the calculation, in the order they appear. */
export const DOTS_GLOSSARY = {
  BW: {
    tex: "BW",
    text: "BW",
    name: "Bodyweight",
    unit: "kg",
    range: `${male.min}–${male.max} kg (men), ${female.min}–${female.max} kg (women) for DOTS`,
    meaning:
      "Your bodyweight in kilograms. Pounds are converted with 1 lb = 0.45359237 kg. DOTS is only defined inside its range, so a bodyweight outside it is moved to the nearest end. GLP has no range and uses your bodyweight as entered.",
  },
  T: {
    tex: "T",
    text: "T",
    name: "Total",
    unit: "kg",
    range: `${n(total.kg.min)}–${n(total.kg.max)} kg`,
    meaning: "Your squat, bench press and deadlift added together, in kilograms.",
  },
  P: {
    tex: "P(BW)",
    text: "P(BW)",
    name: "DOTS reference total",
    unit: "kg",
    range: "—",
    meaning:
      "A curve fitted to what lifters of each bodyweight can total. It's the total that would score exactly 500 DOTS at your bodyweight.",
  },
  DOTS: {
    tex: "\\text{DOTS}",
    text: "DOTS",
    name: "DOTS score",
    unit: "points",
    range: "—",
    meaning:
      "Your total compared with the reference total for your bodyweight, scaled so that matching it scores 500. It lets lifters of different sizes be ranked against each other.",
  },
  Cage: {
    tex: "C_{\\text{age}}",
    text: "C_age",
    name: "Age coefficient",
    unit: "—",
    range: `1.00–${maxCoefficient}`,
    meaning:
      "USA Powerlifting's multiplier for youth (14–22) and masters (40+) lifters. It's 1.00 from 23 to 39, and ages between two listed masters ages are interpolated.",
  },
  DOTSage: {
    tex: "\\text{DOTS}_{\\text{age}}",
    text: "DOTS_age",
    name: "Age-adjusted DOTS",
    unit: "points",
    range: "—",
    meaning: "Your DOTS score multiplied by the age coefficient, for age-group comparisons.",
  },
  A: {
    tex: "A",
    text: "A",
    name: "GLP constant A",
    unit: "kg",
    range: "—",
    meaning:
      "The ceiling of the IPF GL curve: the reference total it approaches for very heavy lifters.",
  },
  B: {
    tex: "B",
    text: "B",
    name: "GLP constant B",
    unit: "kg",
    range: "—",
    meaning: "How far below the ceiling the curve starts at a bodyweight of zero.",
  },
  C: {
    tex: "C",
    text: "C",
    name: "GLP constant C",
    unit: "1/kg",
    range: "—",
    meaning: "How quickly the curve climbs towards its ceiling as bodyweight increases.",
  },
  D: {
    tex: "D(BW)",
    text: "D(BW)",
    name: "GLP reference total",
    unit: "kg",
    range: "—",
    meaning:
      "A − B·e^(−C·BW): the total worth exactly 100 GL points at your bodyweight, for classic (raw) lifting.",
  },
  GLP: {
    tex: "\\text{GLP}",
    text: "GLP",
    name: "IPF GL points",
    unit: "points",
    range: "—",
    meaning:
      "Your total as a percentage of the IPF's reference total for your bodyweight. 100 points means you lifted exactly the reference.",
  },
  S: {
    tex: "S",
    text: "S",
    name: "Target score",
    unit: "points",
    range: "—",
    meaning: "The DOTS or GLP score you'd like to reach.",
  },
  Treq: {
    tex: "T_{\\text{req}}",
    text: "T_req",
    name: "Required total",
    unit: "kg",
    range: "—",
    meaning: "The total you'd need at your bodyweight to score exactly the target.",
  },
  Tage: {
    tex: "T_{\\text{age}}",
    text: "T_age",
    name: "Required total with age coefficient",
    unit: "kg",
    range: "—",
    meaning:
      "The total that reaches the target once your age coefficient is applied. Smaller than the plain requirement whenever the coefficient is above 1.",
  },
} as const satisfies Record<string, GlossaryEntry>

export type DotsSymbolId = keyof typeof DOTS_GLOSSARY

export const DOTS_GLOSSARY_ORDER = Object.keys(DOTS_GLOSSARY) as DotsSymbolId[]
