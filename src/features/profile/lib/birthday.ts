export interface Birthday {
  year: number
  /** 1–12 */
  month: number
  day: number
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export function isRealDate({ year, month, day }: Birthday) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

/** Whole years between a birthday and `today` (a local calendar date). */
export function ageOn(birthday: Birthday, today: Date = new Date()) {
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const hadBirthday = month > birthday.month || (month === birthday.month && day >= birthday.day)
  return year - birthday.year - (hadBirthday ? 0 : 1)
}

/** A calendar date stored as UTC midnight (Postgres `date`). */
export function birthdayToDate({ year, month, day }: Birthday) {
  return new Date(Date.UTC(year, month - 1, day))
}

export function dateToBirthday(date: Date): Birthday {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

export function formatBirthday(birthday: Birthday) {
  return `${MONTHS[birthday.month - 1]} ${birthday.day}, ${birthday.year}`
}
