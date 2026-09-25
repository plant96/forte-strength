import { siteConfig } from "@/config/site"
import { formatEntered, formatNumber, MINUS, texValue } from "@/lib/breakdown/format"
import type {
  BreakdownInputRow,
  BreakdownSection,
  BreakdownSource,
  FormulaStep,
} from "@/lib/breakdown/types"
import { kgToLb, type WeightUnit } from "@/lib/units"

import type { DotsFormValues } from "../schema"
import { AGE_COEFFICIENT_RANGE, type AgeCoefficient } from "./age-coefficient"
import { DOTS_REFERENCE_SCORE, GLP_REFERENCE_SCORE, type Quartic } from "./constants"
import type { DotsResult } from "./dots"
import { DOTS_GLOSSARY, type DotsSymbolId } from "./glossary"
import type { ReverseResult } from "./reverse"

/** Extra widgets a DOTS step can ask its card to render. */
export type DotsStepExtra = "age-table"

export type DotsFormulaStep = FormulaStep<DotsSymbolId, DotsStepExtra>

export type DotsBreakdownSectionId = "dots" | "age" | "glp" | "reverse"

export interface DotsBreakdownSection extends BreakdownSection<DotsSymbolId, DotsStepExtra> {
  id: DotsBreakdownSectionId
}

export interface DotsBreakdown {
  inputs: BreakdownInputRow<DotsSymbolId>[]
  sections: DotsBreakdownSection[]
  totals: { totalKg: number; reference: number; dots: number; ageAdjusted: number; glp: number }
  age: AgeCoefficient
  totalUnit: WeightUnit
}

export const DOTS_SOURCES: readonly BreakdownSource[] = [
  {
    label: "DOTS",
    citation:
      "Konertz T. The DOTS formula, 2019. Used by USA Powerlifting for best-lifter awards; defined for bodyweights of 40–210 kg (men) and 40–150 kg (women), which is why bodyweights outside those ranges are clamped.",
  },
  {
    label: "IPF GL points",
    citation:
      "International Powerlifting Federation. IPF GL Formula, effective 1 May 2020, replacing the 2018 IPF formula. Classic (raw) coefficients; this calculator doesn't cover equipped lifting.",
  },
  {
    label: "Age coefficients",
    citation:
      "USA Powerlifting age coefficients for youth (14–22) and masters (40+) lifters, applied to DOTS for age-group best-lifter awards. Masters ages are published every five years; ages in between are interpolated linearly here. They don't apply to GLP.",
  },
]

const DECIMALS = { kg: 2, score: 2, coefficient: 3 } as const

// ---------------------------------------------------------------------------
// TeX and text helpers
// ---------------------------------------------------------------------------

const POWERS_TEX = ["^4", "^3", "^2", "", ""] as const
const POWERS_TEXT = ["⁴", "³", "²", "", ""] as const

/**
 * `lhs = a·BW⁴ + b·BW³ − …` with the sign taken from each coefficient, split over two
 * aligned lines so the five long coefficients don't force a horizontal scroll.
 */
function polynomialTex(coefficients: Quartic, bw: string, lhs: string) {
  const terms = coefficients.map((coefficient, index) => {
    const power = POWERS_TEX[index]!
    const variable = index === 4 ? "" : bw.startsWith("\\") ? `(${bw})${power}` : `\\,${bw}${power}`
    return { negative: coefficient < 0, body: `${Math.abs(coefficient)}${variable}` }
  })
  const line = (part: typeof terms, leading: boolean) =>
    part
      .map((term, index) =>
        index === 0 && leading
          ? `${term.negative ? "-" : ""}${term.body}`
          : `${term.negative ? "-" : "+"} ${term.body}`,
      )
      .join(" ")
  return `\\begin{aligned} ${lhs} &= ${line(terms.slice(0, 2), true)} \\\\ &\\quad ${line(terms.slice(2), false)} \\end{aligned}`
}

function polynomialText(coefficients: Quartic, bw: string) {
  return coefficients
    .map((coefficient, index) => {
      const sign = coefficient < 0 ? MINUS : "+"
      const magnitude = Math.abs(coefficient)
      const variable = index === 4 ? "" : `·${bw}${POWERS_TEXT[index]}`
      const term = `${magnitude}${variable}`
      return index === 0 ? `${coefficient < 0 ? MINUS : ""}${term}` : `${sign} ${term}`
    })
    .join(" ")
}

const sexLabel = (sex: "male" | "female") => (sex === "male" ? "Male" : "Female")

// ---------------------------------------------------------------------------
// Breakdown
// ---------------------------------------------------------------------------

export function buildDotsBreakdown(
  values: DotsFormValues,
  result: DotsResult,
  reverse: ReverseResult | null,
): DotsBreakdown {
  const { input, bodyweight, dots, age, glp } = result
  const bw = input.bodyweightKg
  const bwDots = bodyweight.kg
  const t = input.totalKg
  const kg = (value: number) => formatNumber(value, DECIMALS.kg)
  const kgTex = (value: number) => texValue(value, DECIMALS.kg)
  const score = (value: number) => formatNumber(value, DECIMALS.score)
  const scoreTex = (value: number) => texValue(value, DECIMALS.score)
  const coef = (value: number) => formatNumber(value, DECIMALS.coefficient)
  const coefTex = (value: number) => texValue(value, DECIMALS.coefficient)

  const inputs: BreakdownInputRow<DotsSymbolId>[] = [
    {
      label: "Bodyweight",
      entered: `${formatEntered(values.weight)} ${values.weightUnit}`,
      used: `${kg(bw)} kg`,
      symbol: "BW",
    },
    ...(bodyweight.clamped
      ? [
          {
            label: "Bodyweight for DOTS",
            entered: `Outside ${bodyweight.range.min}–${bodyweight.range.max} kg`,
            used: `${kg(bwDots)} kg`,
            symbol: "BW" as const,
          },
        ]
      : []),
    {
      label: "Total",
      entered: `${formatEntered(values.total)} ${values.totalUnit}`,
      used: `${kg(t)} kg`,
      symbol: "T",
    },
    { label: "Age", entered: `${input.ageYears}`, used: `${age.usedAge} years`, symbol: null },
    {
      label: "Sex",
      entered: sexLabel(input.sex),
      used: `${sexLabel(input.sex)} coefficients`,
      symbol: null,
    },
  ]

  const dotsSection: DotsBreakdownSection = {
    id: "dots",
    title: "DOTS",
    description:
      "DOTS compares your total with what a lifter of your bodyweight is expected to total, so lifters of any size can be ranked together.",
    steps: [
      {
        id: "p",
        title: "Reference total for your bodyweight",
        description: `A curve fitted to ${input.sex} lifters' totals across bodyweights. Its value at your bodyweight is the total that scores exactly ${DOTS_REFERENCE_SCORE} DOTS.`,
        formula: {
          tex: polynomialTex(dots.coefficients, "BW", "P(BW)"),
          text: `P(BW) = ${polynomialText(dots.coefficients, "BW")}`,
        },
        substituted: {
          tex: polynomialTex(dots.coefficients, kgTex(bwDots), ""),
          text: `= ${polynomialText(dots.coefficients, kg(bwDots))}`,
        },
        result: { symbol: "P", value: dots.denominator, decimals: DECIMALS.kg, unit: "kg" },
        symbols: ["BW", "P"],
        notes: bodyweight.clamped
          ? [
              `DOTS is only defined for ${bodyweight.range.min}–${bodyweight.range.max} kg, so your ${kg(bw)} kg is read as ${kg(bwDots)} kg here. GLP still uses ${kg(bw)} kg.`,
            ]
          : [],
      },
      {
        id: "dots",
        title: "DOTS score",
        description: `Your total divided by the reference total, scaled so that matching the reference scores ${DOTS_REFERENCE_SCORE}.`,
        formula: {
          tex: `\\text{DOTS} = \\frac{T \\times ${DOTS_REFERENCE_SCORE}}{P(BW)}`,
          text: `DOTS = T × ${DOTS_REFERENCE_SCORE} / P(BW)`,
        },
        substituted: {
          tex: `= \\frac{${kgTex(t)} \\times ${DOTS_REFERENCE_SCORE}}{${kgTex(dots.denominator)}}`,
          text: `= ${kg(t)} × ${DOTS_REFERENCE_SCORE} / ${kg(dots.denominator)}`,
        },
        result: { symbol: "DOTS", value: dots.score, decimals: DECIMALS.score, unit: "points" },
        symbols: ["T", "P", "DOTS"],
        notes: [],
      },
    ],
  }

  const ageNotes: string[] = []
  if (age.clamped) {
    ageNotes.push(
      `The table runs from ${AGE_COEFFICIENT_RANGE.min} to ${AGE_COEFFICIENT_RANGE.max}, so your age is read as ${age.usedAge}.`,
    )
  }
  if (age.coefficient === 1) {
    ageNotes.push("Your coefficient is 1.000, so your age-adjusted DOTS equals your DOTS.")
  }

  const ageCoefficientStep: DotsFormulaStep = age.interpolated
    ? {
        id: "cage",
        title: "Age coefficient",
        description: `The table lists ${age.lower.age} and ${age.upper.age}. Your age sits between them, so the coefficient is read off the straight line joining the two.`,
        formula: {
          tex: "C_{\\text{age}} = C_{\\text{lo}} + \\left(C_{\\text{hi}} - C_{\\text{lo}}\\right) \\times \\frac{\\text{age} - a_{\\text{lo}}}{a_{\\text{hi}} - a_{\\text{lo}}}",
          text: `C_age = C_lo + (C_hi ${MINUS} C_lo) × (age ${MINUS} a_lo) / (a_hi ${MINUS} a_lo)`,
        },
        substituted: {
          tex: `= ${coef(age.lower.coefficient)} + \\left(${coef(age.upper.coefficient)} - ${coef(age.lower.coefficient)}\\right) \\times \\frac{${texValue(age.usedAge, 0)} - ${age.lower.age}}{${age.upper.age} - ${age.lower.age}}`,
          text: `= ${coef(age.lower.coefficient)} + (${coef(age.upper.coefficient)} ${MINUS} ${coef(age.lower.coefficient)}) × (${age.usedAge} ${MINUS} ${age.lower.age}) / (${age.upper.age} ${MINUS} ${age.lower.age})`,
        },
        result: { symbol: "Cage", value: age.coefficient, decimals: DECIMALS.coefficient },
        symbols: ["Cage"],
        notes: ageNotes,
        extra: "age-table",
      }
    : {
        id: "cage",
        title: "Age coefficient",
        description:
          "Looked up from USA Powerlifting's table. Youth lifters (14–22) and masters (40+) get a coefficient above 1; from 23 to 39 it's exactly 1.",
        formula: {
          tex: "C_{\\text{age}} = C(\\text{age})",
          text: "C_age = table value for your age",
        },
        substituted: {
          tex: `= C(${texValue(age.usedAge, 0)})`,
          text: `= table value for age ${age.usedAge}`,
        },
        result: { symbol: "Cage", value: age.coefficient, decimals: DECIMALS.coefficient },
        symbols: ["Cage"],
        notes: ageNotes,
        extra: "age-table",
      }

  const ageSection: DotsBreakdownSection = {
    id: "age",
    title: "Age adjustment",
    description:
      "Younger and older lifters are at a disadvantage against lifters in their prime, so USA Powerlifting scales DOTS up by an age coefficient for age-group awards.",
    steps: [
      ageCoefficientStep,
      {
        id: "dotsage",
        title: "Age-adjusted DOTS",
        description: "Your DOTS score multiplied by the coefficient.",
        formula: {
          tex: "\\text{DOTS}_{\\text{age}} = \\text{DOTS} \\times C_{\\text{age}}",
          text: "DOTS_age = DOTS × C_age",
        },
        substituted: {
          tex: `= ${scoreTex(dots.score)} \\times ${coefTex(age.coefficient)}`,
          text: `= ${score(dots.score)} × ${coef(age.coefficient)}`,
        },
        result: {
          symbol: "DOTSage",
          value: age.adjustedScore,
          decimals: DECIMALS.score,
          unit: "points",
        },
        symbols: ["DOTS", "Cage", "DOTSage"],
        notes: [],
      },
    ],
  }

  const { A, B, C } = glp.params
  const glpSection: DotsBreakdownSection = {
    id: "glp",
    title: "IPF GL points",
    description:
      "The International Powerlifting Federation's own scoring. Like DOTS it compares your total with a reference for your bodyweight, but its curve is an exponential that flattens out for heavier lifters.",
    steps: [
      {
        id: "d",
        title: "GLP reference total",
        description: `The IPF's curve for ${input.sex} classic (raw) lifters: the total worth exactly ${GLP_REFERENCE_SCORE} points at your bodyweight. It climbs quickly for light lifters and levels off towards ${formatNumber(A, 2)} kg.`,
        formula: {
          tex: "D(BW) = A - B\\,e^{-C \\cdot BW}",
          text: `D(BW) = A ${MINUS} B·e^(${MINUS}C·BW)`,
        },
        substituted: {
          tex: `= ${A} - ${B}\\,e^{-${C} \\times ${kgTex(bw)}}`,
          text: `= ${A} ${MINUS} ${B} × e^(${MINUS}${C} × ${kg(bw)})`,
        },
        result: { symbol: "D", value: glp.denominator, decimals: DECIMALS.kg, unit: "kg" },
        symbols: ["A", "B", "C", "BW", "D"],
        notes: bodyweight.clamped
          ? [`GLP has no bodyweight range, so it uses your ${kg(bw)} kg as entered.`]
          : [],
      },
      {
        id: "glp",
        title: "GLP score",
        description: `Your total as a percentage of the reference total: ${GLP_REFERENCE_SCORE} points means you lifted exactly the reference.`,
        formula: {
          tex: `\\text{GLP} = \\frac{T \\times ${GLP_REFERENCE_SCORE}}{D(BW)}`,
          text: `GLP = T × ${GLP_REFERENCE_SCORE} / D(BW)`,
        },
        substituted: {
          tex: `= \\frac{${kgTex(t)} \\times ${GLP_REFERENCE_SCORE}}{${kgTex(glp.denominator)}}`,
          text: `= ${kg(t)} × ${GLP_REFERENCE_SCORE} / ${kg(glp.denominator)}`,
        },
        result: { symbol: "GLP", value: glp.score, decimals: DECIMALS.score, unit: "points" },
        symbols: ["T", "D", "GLP"],
        notes: ["Age coefficients don't apply to GLP."],
      },
    ],
  }

  const sections: DotsBreakdownSection[] = [dotsSection, ageSection, glpSection]
  if (reverse) sections.push(reverseSection(reverse, values.totalUnit))

  return {
    inputs,
    sections,
    totals: {
      totalKg: t,
      reference: dots.denominator,
      dots: dots.score,
      ageAdjusted: age.adjustedScore,
      glp: glp.score,
    },
    age,
    totalUnit: values.totalUnit,
  }
}

function reverseSection(reverse: ReverseResult, totalUnit: WeightUnit): DotsBreakdownSection {
  const { input, denominator, totalKg, ageAdjusted } = reverse
  const kg = (value: number) => formatNumber(value, DECIMALS.kg)
  const kgTex = (value: number) => texValue(value, DECIMALS.kg)
  const inLb = (value: number) =>
    totalUnit === "lb" ? [`That's ${formatNumber(kgToLb(value), 1)} lb.`] : []
  const isDots = input.kind === "dots"
  const reference = isDots ? DOTS_REFERENCE_SCORE : GLP_REFERENCE_SCORE
  const referenceSymbol = isDots ? "P" : "D"

  const steps: DotsFormulaStep[] = [
    {
      id: "treq",
      title: `Total for ${formatEntered(input.score)} ${isDots ? "DOTS" : "GLP"}`,
      description: `${isDots ? "DOTS" : "GLP"} is your total times a constant, so turning the formula around gives the total for any score.`,
      formula: {
        tex: `T_{\\text{req}} = \\frac{S \\times ${referenceSymbol}(BW)}{${reference}}`,
        text: `T_req = S × ${referenceSymbol}(BW) / ${reference}`,
      },
      substituted: {
        tex: `= \\frac{${texValue(input.score, 2)} \\times ${kgTex(denominator)}}{${reference}}`,
        text: `= ${formatNumber(input.score, 2)} × ${kg(denominator)} / ${reference}`,
      },
      result: { symbol: "Treq", value: totalKg, decimals: DECIMALS.kg, unit: "kg" },
      symbols: ["S", referenceSymbol, "Treq"],
      notes: [
        ...inLb(totalKg),
        ...(isDots ? [] : ["GLP has no age coefficient, so this total is the same at any age."]),
      ],
    },
  ]

  if (ageAdjusted) {
    steps.push({
      id: "tage",
      title: "With your age coefficient",
      description:
        "Because age-adjusted DOTS multiplies your score, the total you need is divided by the same coefficient.",
      formula: {
        tex: "T_{\\text{age}} = \\frac{T_{\\text{req}}}{C_{\\text{age}}}",
        text: "T_age = T_req / C_age",
      },
      substituted: {
        tex: `= \\frac{${kgTex(totalKg)}}{${texValue(ageAdjusted.coefficient, DECIMALS.coefficient)}}`,
        text: `= ${kg(totalKg)} / ${formatNumber(ageAdjusted.coefficient, DECIMALS.coefficient)}`,
      },
      result: { symbol: "Tage", value: ageAdjusted.totalKg, decimals: DECIMALS.kg, unit: "kg" },
      symbols: ["Treq", "Cage", "Tage"],
      notes: [
        ...inLb(ageAdjusted.totalKg),
        ...(ageAdjusted.coefficient === 1
          ? ["Your coefficient is 1.000, so the two totals are the same."]
          : []),
      ],
    })
  }

  return {
    id: "reverse",
    title: "Required total",
    description: "The total you'd need at your bodyweight to reach the score you typed.",
    steps,
  }
}

/** Plain-text version of the breakdown, for pasting into a message or document. */
export function dotsBreakdownToText(breakdown: DotsBreakdown) {
  const lines: string[] = [
    `${siteConfig.name}: DOTS / GLP calculation`,
    `${siteConfig.url}/tools/dots-calculator`,
    "",
    "INPUTS",
    ...breakdown.inputs.map((row) => {
      const symbol = row.symbol ? `${DOTS_GLOSSARY[row.symbol].text} = ` : ""
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
        const symbol = step.result.symbol ? `${DOTS_GLOSSARY[step.result.symbol].text} ` : ""
        const unit = step.result.unit ? ` ${step.result.unit}` : ""
        lines.push(`    ${symbol}= ${formatNumber(step.result.value, step.result.decimals)}${unit}`)
      }
      for (const note of step.notes) lines.push(`    Note: ${note}`)
    }
  })

  const { totals } = breakdown
  lines.push(
    "",
    "RESULTS",
    `  DOTS ${formatNumber(totals.dots, 2)} · Age-adjusted DOTS ${formatNumber(totals.ageAdjusted, 2)} (× ${formatNumber(breakdown.age.coefficient, 3)}) · GLP ${formatNumber(totals.glp, 2)}`,
    "",
    "Displayed values are rounded; every calculation runs at full precision.",
  )

  return lines.join("\n")
}
