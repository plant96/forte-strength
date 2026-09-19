import type { core } from "zod"

const NUMBER_PATTERN = /^(\d+\.?\d*|\.\d+)$/

/** Parses a user-typed number ("1,200", "5.", ".5"). Returns null when it isn't one. */
export function parseNumberInput(raw: string): number | null {
  const text = raw.trim().replace(/,/g, "")
  if (!NUMBER_PATTERN.test(text)) return null
  return Number(text)
}

export interface NumberRule {
  /** Used in messages, e.g. "Weight must be 70–700 lb". */
  label: string
  min: number
  max: number
  unit?: string
  integer?: boolean
  /** When set, an empty field is allowed and parses to this value. */
  emptyValue?: number
  requiredMessage?: string
}

export interface TextRule {
  label: string
  max: number
  /** Minimum length after trimming (default 1, i.e. required). */
  min?: number
  requiredMessage?: string
}

/**
 * Reads a flat form of string fields inside a Zod `.transform`, collecting a
 * friendly error per field. Check `valid` before returning the parsed values.
 */
export function createFormReader<T extends object>(raw: T, ctx: core.$RefinementCtx) {
  let valid = true
  const values = raw as Record<string, unknown>

  function fail(field: keyof T & string, message: string) {
    valid = false
    ctx.addIssue({ code: "custom", message, path: [field] })
  }

  function number(field: keyof T & string, rule: NumberRule): number {
    const text = String(values[field] ?? "").trim()
    if (text === "" && rule.emptyValue !== undefined) return rule.emptyValue
    if (text === "") {
      fail(field, rule.requiredMessage ?? `Enter your ${rule.label.toLowerCase()}`)
      return Number.NaN
    }

    const value = parseNumberInput(text)
    if (value === null) {
      fail(field, "Enter a number")
      return Number.NaN
    }
    if (rule.integer && !Number.isInteger(value)) {
      fail(field, "Use a whole number")
      return Number.NaN
    }
    if (value < rule.min || value > rule.max) {
      const unit = rule.unit ? (rule.unit === "%" ? "%" : ` ${rule.unit}`) : ""
      fail(
        field,
        `${rule.label} must be ${rule.min.toLocaleString("en-US")}–${rule.max.toLocaleString("en-US")}${unit}`,
      )
      return Number.NaN
    }
    return value
  }

  function text(field: keyof T & string, rule: TextRule): string {
    const value = String(values[field] ?? "").trim()
    const min = rule.min ?? 1
    if (value.length < min) {
      fail(
        field,
        value.length === 0
          ? (rule.requiredMessage ?? `Enter your ${rule.label.toLowerCase()}`)
          : `${rule.label} must be at least ${min} characters`,
      )
    } else if (value.length > rule.max) {
      fail(field, `${rule.label} must be ${rule.max.toLocaleString("en-US")} characters or fewer`)
    }
    return value
  }

  return {
    fail,
    number,
    text,
    get valid() {
      return valid
    },
  }
}

export type FormReader<T extends object> = ReturnType<typeof createFormReader<T>>
