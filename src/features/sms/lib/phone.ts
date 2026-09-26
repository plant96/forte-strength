/**
 * US and Canadian mobile numbers — the only ones a toll-free number can text.
 *
 * Stored as E.164 ("+14155552671"), which is what the messaging provider wants, and shown
 * as "(415) 555-2671". Anything typed with spaces, dots, dashes, brackets or a leading
 * +1 / 1 is accepted; what's left has to be a real North American number: ten digits, with
 * an area code and exchange that don't start with 0 or 1.
 */

const NANP = /^[2-9]\d{2}[2-9]\d{6}$/

/** "+14155552671", or null when it isn't a US/Canadian number. */
export function normalizeUsPhone(input: string): string | null {
  if (!/^[\d\s().+-]*$/.test(input.trim())) return null
  let digits = input.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1)
  return NANP.test(digits) ? `+1${digits}` : null
}

/** "(415) 555-2671" for a stored number; anything unexpected comes back unchanged. */
export function formatUsPhone(e164: string) {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : e164
}
