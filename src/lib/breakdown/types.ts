/**
 * The data model behind a "View the calculations" panel: a list of sections, each a list
 * of steps that show a formula, the same formula with the user's numbers, and the result.
 *
 * `S` is the calculator's symbol id (a key of its glossary); `X` names any extra widgets a
 * step can ask its card to render (a table, say). Each calculator binds them once.
 */

/** A formula written twice: TeX for display, plain text for copying. */
export interface Expression {
  tex: string
  text: string
}

/** One symbol used in a calculation, for the "where" lines and the variables list. */
export interface GlossaryEntry {
  /** TeX used to render the symbol. */
  tex: string
  /** Plain-text symbol for copying. */
  text: string
  name: string
  unit: string
  range: string
  meaning: string
}

export interface StepResult<S extends string> {
  symbol: S | null
  value: number
  decimals: number
  unit?: string
}

export interface GaugeData {
  value: number
  min: number
  max: number
  decimals: number
}

export interface FormulaStep<S extends string, X extends string = never> {
  id: string
  title: string
  description: string
  formula: Expression
  substituted: Expression
  result?: StepResult<S>
  /** Symbols explained in this step's "where" line. */
  symbols: S[]
  notes: string[]
  gauge?: GaugeData
  extra?: X
}

export interface BreakdownSection<S extends string, X extends string = never> {
  id: string
  title: string
  description: string
  steps: FormulaStep<S, X>[]
}

export interface BreakdownInputRow<S extends string> {
  label: string
  entered: string
  used: string
  symbol: S | null
}

export interface BreakdownSource {
  label: string
  citation: string
}
