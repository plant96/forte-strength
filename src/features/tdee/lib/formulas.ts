import { siteConfig } from "@/config/site"
import { KCAL_PER_LB, LB_PER_KG, type WeightUnit } from "@/lib/units"

import type { TdeeFormValues } from "../schema"
import { ACTIVITY_MODEL } from "./activity"
import { HARRIS_BENEDICT_REVISED, KATCH_MCARDLE, MIFFLIN_ST_JEOR } from "./bmr"
import { getIntensityLevel, type IntensityId } from "./constants"
import { GLOSSARY, type SymbolId } from "./glossary"
import { calculateGoalTargets, type GoalTargets } from "./goals"
import {
  calculateMacros,
  MACRO_INFO,
  MACRO_SPLITS,
  type CalorieTarget,
  type MacroAmount,
  type MacroSplit,
} from "./macros"
import { TEF_NOTE, TEF_SOURCE } from "./tef"
import type { TdeeResult } from "./tdee"

/** A formula written twice: TeX for display, plain text for copying. */
export interface Expression {
  tex: string
  text: string
}

export interface StepResult {
  symbol: SymbolId | null
  value: number
  decimals: number
  unit?: string
}

export interface Gauge {
  value: number
  min: number
  max: number
  decimals: number
}

export interface FormulaStep {
  id: string
  title: string
  description: string
  formula: Expression
  substituted: Expression
  result?: StepResult
  /** Symbols explained in this step's "where" line. */
  symbols: SymbolId[]
  notes: string[]
  gauge?: Gauge
  extra?: "intensity-table" | "targets-table" | "macros-table"
}

export type BreakdownSectionId = "bmr" | "activity" | "tdee" | "targets" | "macros"

export interface BreakdownSection {
  id: BreakdownSectionId
  title: string
  description: string
  steps: FormulaStep[]
}

export interface BreakdownInputRow {
  label: string
  entered: string
  used: string
  symbol: SymbolId | null
}

export interface Breakdown {
  inputs: BreakdownInputRow[]
  sections: BreakdownSection[]
  targets: GoalTargets
  goalUnit: WeightUnit
  intensityId: IntensityId
  totals: { bmr: number; multiplier: number; tdee: number }
  macros: {
    target: CalorieTarget
    diets: { split: MacroSplit; amounts: MacroAmount[] }[]
  }
}

export const SOURCES = [
  {
    label: "Revised Harris-Benedict",
    citation:
      "Roza AM, Shizgal HM. The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. Am J Clin Nutr. 1984;40(1):168–182.",
  },
  {
    label: "Mifflin-St Jeor",
    citation:
      "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247.",
  },
  {
    label: "Katch-McArdle",
    citation:
      "McArdle WD, Katch FI, Katch VL. Exercise Physiology: Nutrition, Energy, and Human Performance. Lippincott Williams & Wilkins.",
  },
  {
    label: "3,500 kcal per lb",
    citation:
      "Wishnofsky M. Caloric equivalents of gained or lost weight. Am J Clin Nutr. 1958;6(5):542–546.",
  },
  {
    label: "Activity multiplier",
    citation:
      "Forte Strength Systems' own model: a saturating step curve plus a saturating training curve, minus a small overlap correction.",
  },
  {
    label: "Macro grams",
    citation:
      "Atwater general factors: 4 kcal per gram of protein and carbohydrate, 9 kcal per gram of fat. The three splits are Forte Strength Systems' recommendations.",
  },
  {
    label: "Thermic effect of food (not included)",
    citation: TEF_SOURCE,
  },
] as const

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

const MINUS = "−"

/** Fixed decimals with thousands separators, e.g. 1839 → "1,839.0". */
export function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Up to two decimals without trailing zeros, for echoing what the user typed. */
function formatEntered(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

const texNumber = (value: number, decimals: number) =>
  formatNumber(value, decimals).replace(/,/g, "{,}")

/** Wraps one of the user's numbers so it's highlighted (see the `\val` macro in <Tex>). */
const texValue = (value: number, decimals: number) => `\\val{${texNumber(value, decimals)}}`

const texEntered = (value: number) => `\\val{${formatEntered(value).replace(/,/g, "{,}")}}`

const DECIMALS = { kg: 2, cm: 1, kcal: 1, ratio: 4 } as const

// ---------------------------------------------------------------------------
// Breakdown
// ---------------------------------------------------------------------------

export function buildBreakdown(
  values: TdeeFormValues,
  result: TdeeResult,
  goalUnit: WeightUnit,
  calorieTarget: CalorieTarget,
): Breakdown {
  const { input, bmr, activity, intensityScore, tdee } = result
  const { weightKg: w, heightCm: h, ageYears: a, sex, bodyFatPercent: bf } = input
  const intensityId: IntensityId = input.sessionsPerWeek > 0 ? input.intensity : "none"
  const intensity = getIntensityLevel(intensityId)
  const targets = calculateGoalTargets(tdee, bmr.average, goalUnit)

  const hb = HARRIS_BENEDICT_REVISED[sex]
  const msj = MIFFLIN_ST_JEOR
  const msjOffset = msj.sexOffset[sex]
  const km = KATCH_MCARDLE
  const m = ACTIVITY_MODEL
  const sexLabel = sex === "male" ? "Male" : "Female"
  const signedTex = (n: number) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`)
  const signedText = (n: number) => (n >= 0 ? `+ ${n}` : `${MINUS} ${Math.abs(n)}`)

  const inputs: BreakdownInputRow[] = [
    {
      label: "Bodyweight",
      entered: `${formatEntered(values.weight)} ${values.weightUnit}`,
      used: `${formatNumber(w, DECIMALS.kg)} kg`,
      symbol: "W",
    },
    {
      label: "Height",
      entered:
        values.height.unit === "cm"
          ? `${formatEntered(values.height.cm)} cm`
          : `${values.height.ft}′ ${formatEntered(values.height.in)}″`,
      used: `${formatNumber(h, DECIMALS.cm)} cm`,
      symbol: "H",
    },
    { label: "Age", entered: `${a}`, used: `${a} years`, symbol: "A" },
    { label: "Sex", entered: sexLabel, used: `${sexLabel} coefficients`, symbol: null },
    {
      label: "Body fat",
      entered: `${formatEntered(bf)}%`,
      used: `${formatEntered(bf)}%`,
      symbol: "BF",
    },
    {
      label: "Lean body mass",
      entered: "Calculated",
      used: `${formatNumber(bmr.leanMassKg, DECIMALS.kg)} kg`,
      symbol: "LBM",
    },
    {
      label: "Daily steps",
      entered: formatEntered(input.stepsPerDay),
      used: formatEntered(input.stepsPerDay),
      symbol: "P",
    },
    {
      label: "Training sessions",
      entered: `${input.sessionsPerWeek} / week`,
      used: `${input.sessionsPerWeek}`,
      symbol: "F",
    },
    {
      label: "Intensity",
      entered: intensity.label,
      used: formatNumber(intensityScore, 2),
      symbol: "I",
    },
  ]

  const bmrSection: BreakdownSection = {
    id: "bmr",
    title: "Basal metabolic rate",
    description:
      "Three well-known equations each estimate how many calories you burn at rest. Averaging them evens out their differences.",
    steps: [
      {
        id: "hb",
        title: "Revised Harris-Benedict",
        description: `Roza & Shizgal's 1984 revision, using the ${sex} coefficients.`,
        formula: {
          tex: `\\text{BMR}_{\\text{HB}} = ${hb.base} + ${hb.weight}\\,W + ${hb.height}\\,H - ${hb.age}\\,A`,
          text: `BMR_HB = ${hb.base} + ${hb.weight}·W + ${hb.height}·H ${MINUS} ${hb.age}·A`,
        },
        substituted: {
          tex: `= ${hb.base} + ${hb.weight}(${texValue(w, DECIMALS.kg)}) + ${hb.height}(${texValue(h, DECIMALS.cm)}) - ${hb.age}(${texValue(a, 0)})`,
          text: `= ${hb.base} + ${hb.weight} × ${formatNumber(w, DECIMALS.kg)} + ${hb.height} × ${formatNumber(h, DECIMALS.cm)} ${MINUS} ${hb.age} × ${a}`,
        },
        result: {
          symbol: null,
          value: bmr.harrisBenedict,
          decimals: DECIMALS.kcal,
          unit: "kcal/day",
        },
        symbols: ["W", "H", "A"],
        notes: [],
      },
      {
        id: "msj",
        title: "Mifflin-St Jeor",
        description: `Mifflin et al., 1990, using the ${sex} constant (${signedText(msjOffset)}).`,
        formula: {
          tex: `\\text{BMR}_{\\text{MSJ}} = ${msj.weight}\\,W + ${msj.height}\\,H - ${msj.age}\\,A ${signedTex(msjOffset)}`,
          text: `BMR_MSJ = ${msj.weight}·W + ${msj.height}·H ${MINUS} ${msj.age}·A ${signedText(msjOffset)}`,
        },
        substituted: {
          tex: `= ${msj.weight}(${texValue(w, DECIMALS.kg)}) + ${msj.height}(${texValue(h, DECIMALS.cm)}) - ${msj.age}(${texValue(a, 0)}) ${signedTex(msjOffset)}`,
          text: `= ${msj.weight} × ${formatNumber(w, DECIMALS.kg)} + ${msj.height} × ${formatNumber(h, DECIMALS.cm)} ${MINUS} ${msj.age} × ${a} ${signedText(msjOffset)}`,
        },
        result: {
          symbol: null,
          value: bmr.mifflinStJeor,
          decimals: DECIMALS.kcal,
          unit: "kcal/day",
        },
        symbols: ["W", "H", "A"],
        notes: [],
      },
      {
        id: "km",
        title: "Katch-McArdle",
        description:
          "Uses lean body mass instead of total weight, so it accounts for body composition.",
        formula: {
          tex: `\\begin{aligned} \\text{LBM} &= W\\left(1 - \\frac{BF}{100}\\right) \\\\ \\text{BMR}_{\\text{KM}} &= ${km.base} + ${km.leanMass}\\,\\text{LBM} \\end{aligned}`,
          text: `LBM = W × (1 ${MINUS} BF/100);  BMR_KM = ${km.base} + ${km.leanMass}·LBM`,
        },
        substituted: {
          tex: `\\begin{aligned} \\text{LBM} &= ${texValue(w, DECIMALS.kg)}\\left(1 - \\frac{${texEntered(bf)}}{100}\\right) = ${texValue(bmr.leanMassKg, DECIMALS.kg)}\\ \\text{kg} \\\\ \\text{BMR}_{\\text{KM}} &= ${km.base} + ${km.leanMass}(${texValue(bmr.leanMassKg, DECIMALS.kg)}) \\end{aligned}`,
          text: `LBM = ${formatNumber(w, DECIMALS.kg)} × (1 ${MINUS} ${formatEntered(bf)}/100) = ${formatNumber(bmr.leanMassKg, DECIMALS.kg)} kg;  BMR_KM = ${km.base} + ${km.leanMass} × ${formatNumber(bmr.leanMassKg, DECIMALS.kg)}`,
        },
        result: {
          symbol: null,
          value: bmr.katchMcArdle,
          decimals: DECIMALS.kcal,
          unit: "kcal/day",
        },
        symbols: ["W", "BF", "LBM"],
        notes: [],
      },
      {
        id: "bmr",
        title: "Average BMR",
        description: "The mean of the three equations is the BMR used for everything that follows.",
        formula: {
          tex: `\\text{BMR} = \\frac{\\text{BMR}_{\\text{HB}} + \\text{BMR}_{\\text{MSJ}} + \\text{BMR}_{\\text{KM}}}{3}`,
          text: "BMR = (BMR_HB + BMR_MSJ + BMR_KM) / 3",
        },
        substituted: {
          tex: `= \\frac{${texValue(bmr.harrisBenedict, DECIMALS.kcal)} + ${texValue(bmr.mifflinStJeor, DECIMALS.kcal)} + ${texValue(bmr.katchMcArdle, DECIMALS.kcal)}}{3}`,
          text: `= (${formatNumber(bmr.harrisBenedict, DECIMALS.kcal)} + ${formatNumber(bmr.mifflinStJeor, DECIMALS.kcal)} + ${formatNumber(bmr.katchMcArdle, DECIMALS.kcal)}) / 3`,
        },
        result: { symbol: "BMR", value: bmr.average, decimals: DECIMALS.kcal, unit: "kcal/day" },
        symbols: ["BMR"],
        notes: [],
      },
    ],
  }

  const stepCapTex = texNumber(m.stepCap, 0)
  const activityNotes = {
    x: activity.stepsCapped
      ? [`You average more than ${formatNumber(m.stepCap, 0)} steps a day, so x is capped at 1.`]
      : [],
    q: [
      ...(activity.sessionsCapped
        ? [`Sessions beyond ${m.sessionCap} a week don't add more, so F counts as ${m.sessionCap}.`]
        : []),
      ...(input.sessionsPerWeek === 0
        ? ["You train 0 sessions a week, so I = 0 (No training)."]
        : []),
    ],
    m: activity.multiplierClamped
      ? [
          `Before the limits M was ${formatNumber(activity.rawMultiplier, DECIMALS.ratio)}, so it's held inside ${m.multiplierMin.toFixed(2)}–${m.multiplierMax.toFixed(2)}.`,
        ]
      : [],
  }

  const activitySection: BreakdownSection = {
    id: "activity",
    title: "Activity multiplier",
    description:
      "Daily steps and training each add to a baseline of 1.01, with diminishing returns, then a small overlap correction is removed.",
    steps: [
      {
        id: "x",
        title: "Step ratio",
        description: `Your steps as a fraction of the ${formatNumber(m.stepCap, 0)}-step cap.`,
        formula: {
          tex: `x = \\min\\left(\\frac{P}{${stepCapTex}},\\ 1\\right)`,
          text: `x = min(P / ${formatNumber(m.stepCap, 0)}, 1)`,
        },
        substituted: {
          tex: `= \\min\\left(\\frac{${texValue(input.stepsPerDay, 0)}}{${stepCapTex}},\\ 1\\right)`,
          text: `= min(${formatNumber(input.stepsPerDay, 0)} / ${formatNumber(m.stepCap, 0)}, 1)`,
        },
        result: { symbol: "x", value: activity.x, decimals: DECIMALS.ratio },
        symbols: ["P", "x"],
        notes: activityNotes.x,
      },
      {
        id: "s",
        title: "Step component",
        description: "Going from 2k to 8k steps matters more than going from 12k to 18k.",
        formula: {
          tex: `S = ${m.stepMax.toFixed(2)} \\cdot \\frac{1 - e^{-${m.stepCurve}x}}{1 - e^{-${m.stepCurve}}}`,
          text: `S = ${m.stepMax.toFixed(2)} × (1 ${MINUS} e^(${MINUS}${m.stepCurve}x)) / (1 ${MINUS} e^(${MINUS}${m.stepCurve}))`,
        },
        substituted: {
          tex: `= ${m.stepMax.toFixed(2)} \\cdot \\frac{1 - e^{-${m.stepCurve}(${texValue(activity.x, DECIMALS.ratio)})}}{1 - e^{-${m.stepCurve}}}`,
          text: `= ${m.stepMax.toFixed(2)} × (1 ${MINUS} e^(${MINUS}${m.stepCurve} × ${formatNumber(activity.x, DECIMALS.ratio)})) / (1 ${MINUS} e^(${MINUS}${m.stepCurve}))`,
        },
        result: { symbol: "S", value: activity.s, decimals: DECIMALS.ratio },
        symbols: ["x", "S"],
        notes: [],
        gauge: { value: activity.s, min: 0, max: m.stepMax, decimals: 2 },
      },
      {
        id: "q",
        title: "Training load",
        description: `Frequency (capped at ${m.sessionCap} sessions) combined with intensity.`,
        formula: {
          tex: `\\begin{aligned} f &= \\frac{\\min(F,\\ ${m.sessionCap})}{${m.sessionCap}} \\\\ q &= f \\cdot I \\end{aligned}`,
          text: `f = min(F, ${m.sessionCap}) / ${m.sessionCap};  q = f × I`,
        },
        substituted: {
          tex: `\\begin{aligned} f &= \\frac{\\min(${texValue(input.sessionsPerWeek, 0)},\\ ${m.sessionCap})}{${m.sessionCap}} = ${texValue(activity.f, 2)} \\\\ q &= ${texValue(activity.f, 2)} \\cdot ${texValue(intensityScore, 2)} \\end{aligned}`,
          text: `f = min(${input.sessionsPerWeek}, ${m.sessionCap}) / ${m.sessionCap} = ${formatNumber(activity.f, 2)};  q = ${formatNumber(activity.f, 2)} × ${formatNumber(intensityScore, 2)}`,
        },
        result: { symbol: "q", value: activity.q, decimals: DECIMALS.ratio },
        symbols: ["F", "f", "I", "q"],
        notes: activityNotes.q,
        extra: "intensity-table",
      },
      {
        id: "t",
        title: "Training component",
        description: `Five very hard sessions a week is the ceiling (T = ${m.trainingMax.toFixed(2)}).`,
        formula: {
          tex: `T = ${m.trainingMax.toFixed(2)} \\cdot \\frac{1 - e^{-${m.trainingCurve}q}}{1 - e^{-${m.trainingCurve}}}`,
          text: `T = ${m.trainingMax.toFixed(2)} × (1 ${MINUS} e^(${MINUS}${m.trainingCurve}q)) / (1 ${MINUS} e^(${MINUS}${m.trainingCurve}))`,
        },
        substituted: {
          tex: `= ${m.trainingMax.toFixed(2)} \\cdot \\frac{1 - e^{-${m.trainingCurve}(${texValue(activity.q, DECIMALS.ratio)})}}{1 - e^{-${m.trainingCurve}}}`,
          text: `= ${m.trainingMax.toFixed(2)} × (1 ${MINUS} e^(${MINUS}${m.trainingCurve} × ${formatNumber(activity.q, DECIMALS.ratio)})) / (1 ${MINUS} e^(${MINUS}${m.trainingCurve}))`,
        },
        result: { symbol: "T", value: activity.t, decimals: DECIMALS.ratio },
        symbols: ["q", "T"],
        notes: [],
        gauge: { value: activity.t, min: 0, max: m.trainingMax, decimals: 2 },
      },
      {
        id: "d",
        title: "Overlap correction",
        description: "Only meaningfully subtracts when both movement and training are high.",
        formula: {
          tex: `D = ${m.overlapMax.toFixed(2)} \\cdot \\frac{S}{${m.stepMax.toFixed(2)}} \\cdot \\frac{T}{${m.trainingMax.toFixed(2)}}`,
          text: `D = ${m.overlapMax.toFixed(2)} × (S / ${m.stepMax.toFixed(2)}) × (T / ${m.trainingMax.toFixed(2)})`,
        },
        substituted: {
          tex: `= ${m.overlapMax.toFixed(2)} \\cdot \\frac{${texValue(activity.s, DECIMALS.ratio)}}{${m.stepMax.toFixed(2)}} \\cdot \\frac{${texValue(activity.t, DECIMALS.ratio)}}{${m.trainingMax.toFixed(2)}}`,
          text: `= ${m.overlapMax.toFixed(2)} × (${formatNumber(activity.s, DECIMALS.ratio)} / ${m.stepMax.toFixed(2)}) × (${formatNumber(activity.t, DECIMALS.ratio)} / ${m.trainingMax.toFixed(2)})`,
        },
        result: { symbol: "D", value: activity.d, decimals: DECIMALS.ratio },
        symbols: ["S", "T", "D"],
        notes: [],
        gauge: { value: activity.d, min: 0, max: m.overlapMax, decimals: 2 },
      },
      {
        id: "m",
        title: "Activity multiplier",
        description: `Baseline + steps + training − overlap, kept within ${m.multiplierMin.toFixed(2)}–${m.multiplierMax.toFixed(2)}.`,
        formula: {
          tex: `M = \\min\\big(${m.multiplierMax.toFixed(2)},\\ \\max(${m.multiplierMin.toFixed(2)},\\ ${m.baseline.toFixed(2)} + S + T - D)\\big)`,
          text: `M = min(${m.multiplierMax.toFixed(2)}, max(${m.multiplierMin.toFixed(2)}, ${m.baseline.toFixed(2)} + S + T ${MINUS} D))`,
        },
        substituted: {
          tex: `= \\min\\big(${m.multiplierMax.toFixed(2)},\\ \\max(${m.multiplierMin.toFixed(2)},\\ ${m.baseline.toFixed(2)} + ${texValue(activity.s, DECIMALS.ratio)} + ${texValue(activity.t, DECIMALS.ratio)} - ${texValue(activity.d, DECIMALS.ratio)})\\big)`,
          text: `= min(${m.multiplierMax.toFixed(2)}, max(${m.multiplierMin.toFixed(2)}, ${m.baseline.toFixed(2)} + ${formatNumber(activity.s, DECIMALS.ratio)} + ${formatNumber(activity.t, DECIMALS.ratio)} ${MINUS} ${formatNumber(activity.d, DECIMALS.ratio)}))`,
        },
        result: { symbol: "M", value: activity.multiplier, decimals: DECIMALS.ratio },
        symbols: ["S", "T", "D", "M"],
        notes: activityNotes.m,
        gauge: {
          value: activity.multiplier,
          min: m.multiplierMin,
          max: m.multiplierMax,
          decimals: 2,
        },
      },
    ],
  }

  const tdeeSection: BreakdownSection = {
    id: "tdee",
    title: "Total daily energy expenditure",
    description: "Your BMR scaled by how active you are: your maintenance calories.",
    steps: [
      {
        id: "tdee",
        title: "TDEE",
        description: "Eat this many calories a day to maintain your current weight.",
        formula: {
          tex: "\\text{TDEE} = \\text{BMR} \\times M",
          text: "TDEE = BMR × M",
        },
        substituted: {
          tex: `= ${texValue(bmr.average, DECIMALS.kcal)} \\times ${texValue(activity.multiplier, DECIMALS.ratio)}`,
          text: `= ${formatNumber(bmr.average, DECIMALS.kcal)} × ${formatNumber(activity.multiplier, DECIMALS.ratio)}`,
        },
        result: { symbol: "TDEE", value: tdee, decimals: DECIMALS.kcal, unit: "kcal/day" },
        symbols: ["BMR", "M", "TDEE"],
        notes: [],
      },
    ],
  }

  const conversionTex =
    goalUnit === "kg" ? `DD &= DD_{\\text{kg}} \\times ${formatNumber(LB_PER_KG, 5)} \\\\ ` : ""
  const conversionText = goalUnit === "kg" ? `DD = DD_kg × ${formatNumber(LB_PER_KG, 5)};  ` : ""
  const deltaLinesTex = targets.cut
    .map((target) => {
      const rate =
        goalUnit === "kg"
          ? `${texValue(target.rate, 2)}\\ \\text{kg} \\to ${texNumber(target.rateLb, 4)}\\ \\text{lb}`
          : `${texValue(target.rate, 2)}\\ \\text{lb}`
      const ddTex = goalUnit === "kg" ? texNumber(target.rateLb, 4) : texNumber(target.rate, 2)
      return `${rate} &:\\quad \\Delta = \\frac{${KCAL_PER_LB} \\times ${ddTex}}{7} = ${texNumber(target.dailyDelta, DECIMALS.kcal)}`
    })
    .join(" \\\\ ")
  const deltaLinesText = targets.cut
    .map((target) => {
      const rate =
        goalUnit === "kg"
          ? `${formatNumber(target.rate, 2)} kg → ${formatNumber(target.rateLb, 4)} lb`
          : `${formatNumber(target.rate, 2)} lb`
      const dd = goalUnit === "kg" ? formatNumber(target.rateLb, 4) : formatNumber(target.rate, 2)
      return `${rate}: Δ = ${KCAL_PER_LB} × ${dd} / 7 = ${formatNumber(target.dailyDelta, DECIMALS.kcal)}`
    })
    .join("\n")

  const targetsSection: BreakdownSection = {
    id: "targets",
    title: "Calorie targets",
    description: `Each pound of body mass is treated as ${formatNumber(KCAL_PER_LB, 0)} kcal, spread evenly across the 7 days of the week.`,
    steps: [
      {
        id: "delta",
        title: "Daily adjustment",
        description:
          goalUnit === "kg"
            ? "kg rates are converted to lb first, so both units use exactly the same math."
            : "Subtract Δ from TDEE to cut, or add it to bulk.",
        formula: {
          tex: `\\begin{aligned} ${conversionTex}\\Delta &= \\frac{${KCAL_PER_LB} \\cdot DD}{7} \\\\ \\text{Cut} &= \\text{TDEE} - \\Delta \\\\ \\text{Bulk} &= \\text{TDEE} + \\Delta \\end{aligned}`,
          text: `${conversionText}Δ = ${KCAL_PER_LB} × DD / 7;  Cut = TDEE ${MINUS} Δ;  Bulk = TDEE + Δ`,
        },
        substituted: {
          tex: `\\begin{aligned} ${deltaLinesTex} \\end{aligned}`,
          text: deltaLinesText,
        },
        symbols: ["DD", "Delta", "TDEE"],
        notes: [],
        extra: "targets-table",
      },
    ],
  }

  const diets = MACRO_SPLITS.map((split) => ({
    split,
    amounts: calculateMacros(calorieTarget.calories, split),
  }))
  const example = diets[0]
  const e = calorieTarget.calories
  const exampleLines = (example?.amounts ?? []).map((amount) => {
    const { label, kcalPerGram } = MACRO_INFO[amount.macro]
    const share = formatNumber(amount.percent / 100, 3)
    return {
      tex: `\\text{${label}} &= \\frac{${texValue(e, DECIMALS.kcal)} \\times ${share}}{${kcalPerGram}} = ${texNumber(amount.grams, 1)}\\ \\text{g}`,
      text: `${label}: ${formatNumber(e, DECIMALS.kcal)} × ${share} / ${kcalPerGram} = ${formatNumber(amount.grams, 1)} g`,
    }
  })

  const macrosSection: BreakdownSection = {
    id: "macros",
    title: "Macronutrients",
    description:
      "Each diet splits your calorie target by percentage, then converts each macro's calories into grams.",
    steps: [
      {
        id: "macros",
        title: "Macro grams",
        description: `Built from your calorie target: ${calorieTarget.label} (${formatNumber(e, 0)} kcal/day). You can change it in the macros section.`,
        formula: {
          tex: "g = \\frac{E \\times s}{k}",
          text: "g = E × s / k",
        },
        substituted: {
          tex: `\\begin{aligned} ${exampleLines.map((line) => line.tex).join(" \\\\ ")} \\end{aligned}`,
          text: exampleLines.map((line) => line.text).join("\n"),
        },
        symbols: ["E", "s", "k", "g"],
        notes: [
          `Worked example uses the ${example?.split.name ?? "Standard"} split. The table covers all three.`,
        ],
        extra: "macros-table",
      },
    ],
  }

  return {
    inputs,
    sections: [bmrSection, activitySection, tdeeSection, targetsSection, macrosSection],
    targets,
    goalUnit,
    intensityId,
    totals: { bmr: bmr.average, multiplier: activity.multiplier, tdee },
    macros: { target: calorieTarget, diets },
  }
}

// ---------------------------------------------------------------------------
// Plain-text export
// ---------------------------------------------------------------------------

function formatSigned(value: number, decimals: number) {
  return `${value < 0 ? MINUS : "+"}${formatNumber(Math.abs(value), decimals)}`
}

/** Plain-text version of the breakdown, for pasting into a message or document. */
export function breakdownToText(breakdown: Breakdown) {
  const lines: string[] = [
    `${siteConfig.name}: TDEE calculation`,
    `${siteConfig.url}/tdee-calculator`,
    "",
    "INPUTS",
    ...breakdown.inputs.map((row) => {
      const symbol = row.symbol ? `${GLOSSARY[row.symbol].text} = ` : ""
      return `  ${row.label}: ${row.entered} → ${symbol}${row.used}`
    }),
  ]

  breakdown.sections.forEach((section, index) => {
    lines.push("", `STEP ${index + 1}: ${section.title.toUpperCase()}`)
    for (const step of section.steps) {
      lines.push(`  ${step.title}`)
      lines.push(`    ${step.formula.text}`)
      for (const line of step.substituted.text.split("\n")) lines.push(`    ${line}`)
      if (step.result) {
        const symbol = step.result.symbol ? `${GLOSSARY[step.result.symbol].text} ` : ""
        const unit = step.result.unit ? ` ${step.result.unit}` : ""
        lines.push(`    ${symbol}= ${formatNumber(step.result.value, step.result.decimals)}${unit}`)
      }
      for (const note of step.notes) lines.push(`    Note: ${note}`)
    }
  })

  const { targets, goalUnit } = breakdown
  lines.push("", `TARGETS (per week, ${goalUnit})`)
  targets.cut.forEach((cut, index) => {
    const bulk = targets.bulk[index]
    if (!bulk) return
    lines.push(
      `  ${formatNumber(cut.rate, 2)} ${goalUnit}/week: cut ${formatNumber(cut.calories, 0)} kcal/day (${formatSigned(-cut.dailyDelta, 0)}), bulk ${formatNumber(bulk.calories, 0)} kcal/day (${formatSigned(bulk.dailyDelta, 0)})`,
    )
  })

  const { macros } = breakdown
  lines.push(
    "",
    `MACROS (${macros.target.label}, ${formatNumber(macros.target.calories, 0)} kcal/day)`,
  )
  for (const diet of macros.diets) {
    const parts = diet.amounts.map(
      (amount) =>
        `${MACRO_INFO[amount.macro].label.toLowerCase()} ${formatNumber(amount.grams, 0)} g (${amount.percent}%)`,
    )
    const favorite = diet.split.coachFavorite ? " [Coach Ty's favorite]" : ""
    lines.push(`  ${diet.split.name}${favorite}: ${parts.join(", ")}`)
  }

  lines.push(
    "",
    TEF_NOTE,
    "Displayed values are rounded; every calculation runs at full precision.",
    "",
    "VARIABLES",
    ...Object.values(GLOSSARY).map(
      (entry) =>
        `  ${entry.text}: ${entry.name} (${entry.unit}, range ${entry.range}). ${entry.meaning}`,
    ),
  )

  return lines.join("\n")
}
