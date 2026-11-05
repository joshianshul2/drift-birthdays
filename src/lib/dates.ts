// Pure date helpers — no platform deps, unit-testable with plain node.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** Days in month (month 1-12). Year defaults to a leap year so Feb 29 is valid input. */
export function daysInMonth(month: number, year = 2024): number {
  return new Date(year, month, 0).getDate()
}

/** Local midnight for a date — avoids DST/time-of-day off-by-one errors. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * The date a birthday is observed in a given year.
 * Feb 29 birthdays are observed on Feb 28 in non-leap years.
 */
export function observedDate(month: number, day: number, year: number): Date {
  if (month === 2 && day === 29 && !isLeapYear(year)) return new Date(year, 1, 28)
  return new Date(year, month - 1, day)
}

/** Next occurrence on or after today (today counts as "0 days away"). */
export function nextOccurrence(month: number, day: number, now = new Date()): Date {
  const today = startOfDay(now)
  const thisYear = observedDate(month, day, today.getFullYear())
  return thisYear >= today ? thisYear : observedDate(month, day, today.getFullYear() + 1)
}

export function daysUntil(month: number, day: number, now = new Date()): number {
  const ms = nextOccurrence(month, day, now).getTime() - startOfDay(now).getTime()
  return Math.round(ms / 86_400_000) // round absorbs any 23/25h DST days
}

/** Age they turn on their next birthday, if birth year is known. */
export function turningAge(month: number, day: number, year: number | undefined, now = new Date()): number | null {
  if (!year) return null
  const age = nextOccurrence(month, day, now).getFullYear() - year
  return age > 0 ? age : null
}

/**
 * Month/day to fire a reminder `offsetDays` before the birthday, as a yearly
 * repeating rule. Computed against a non-leap year so the rule is stable:
 * Feb 29 → Feb 28, and "1 day before Mar 1" → Feb 28.
 */
export function reminderMonthDay(month: number, day: number, offsetDays: number): { month: number; day: number } {
  const base = observedDate(month, day, 2025)
  base.setDate(base.getDate() - offsetDays)
  return { month: base.getMonth() + 1, day: base.getDate() }
}

export function relativeLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 14) return 'Next week'
  if (days < 31) return `In ${Math.round(days / 7)} weeks`
  const months = Math.round(days / 30.4)
  return months <= 1 ? 'In a month' : `In ${months} months`
}

export function formatMonthDay(month: number, day: number): string {
  return `${day} ${MONTHS[month - 1]}`
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
