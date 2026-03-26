export function toStartOfDayUTC(input: Date | string | number): Date {
  const d = new Date(input)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function addDaysUTC(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
}

export function isSameDayUTC(a: Date, b: Date): boolean {
  return toStartOfDayUTC(a).getTime() === toStartOfDayUTC(b).getTime()
}

// month is 1-12 (human-friendly)
export function getMonthRangeUTC(year: number, month: number) {
  const monthIndex = month - 1
  const start = new Date(Date.UTC(year, monthIndex, 1))
  const endExclusive = new Date(Date.UTC(year, monthIndex + 1, 1))
  return { start, endExclusive }
}

// month is 1-12 (human-friendly)
export function daysInMonthUTC(year: number, month: number): number {
  // day 0 of the next month is the last day of the requested month
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function formatDateKeyUTC(input: Date | string | number): string {
  const d = toStartOfDayUTC(input)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

