/**
 * Number formatting shared by the calculators' "View the calculations" panels.
 * The TeX helpers wrap user-supplied numbers so they can be highlighted.
 */

export const MINUS = "−"

/** Fixed decimals with thousands separators, e.g. 1839 → "1,839.0". */
export function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Up to two decimals without trailing zeros, for echoing what the user typed. */
export function formatEntered(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

/** A number for TeX: thousands separators become `{,}` so KaTeX doesn't space them. */
export const texNumber = (value: number, decimals: number) =>
  formatNumber(value, decimals).replace(/,/g, "{,}")

/** Wraps one of the user's numbers so it's highlighted (see the `\val` macro in <Tex>). */
export const texValue = (value: number, decimals: number) => `\\val{${texNumber(value, decimals)}}`

export const texEntered = (value: number) => `\\val{${formatEntered(value).replace(/,/g, "{,}")}}`
