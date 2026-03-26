import { addDaysUTC, toStartOfDayUTC } from "@/utils/date"

/**
 * Streak = number of continuous completed days counting backwards from `today`.
 * `completedDatesDesc` must be sorted by `date` descending.
 */
export function calculateStreakFromCompletedDatesDesc(
  completedDatesDesc: Date[],
  today: Date
): number {
  let streak = 0
  let expected = toStartOfDayUTC(today)

  for (const date of completedDatesDesc) {
    const day = toStartOfDayUTC(date)
    if (day.getTime() !== expected.getTime()) break
    streak += 1
    expected = addDaysUTC(expected, -1)
  }

  return streak
}

