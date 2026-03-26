import mongoose, { type Types } from "mongoose"
import { HabitModel, type HabitDocument } from "@/models/Habit"
import { HabitLogModel, type HabitLogDocument } from "@/models/HabitLog"

type HabitLogStatics = {
  toggleHabitForDate: (
    habitId: string | Types.ObjectId,
    dateInput: Date | string | number
  ) => Promise<HabitLogDocument>
  getLogsForHabitForMonth: (
    habitId: string | Types.ObjectId,
    year: number,
    month: number
  ) => Promise<HabitLogDocument[]>
  countCompletedDaysInMonth: (
    habitId: string | Types.ObjectId,
    year: number,
    month: number
  ) => Promise<number>
  calculateStreak: (
    habitId: string | Types.ObjectId,
    todayInput?: Date | string | number
  ) => Promise<number>
  calculateSuccessRate: (
    habitId: string | Types.ObjectId,
    year: number,
    month: number
  ) => Promise<{ completedDays: number; totalTrackedDays: number; successRate: number }>
}

const HabitLog = HabitLogModel as unknown as mongoose.Model<HabitLogDocument> & HabitLogStatics
const Habit = HabitModel as unknown as mongoose.Model<HabitDocument>

// Logic:
// - If log exists for (habitId, date): toggle `status`
// - Else: create log with `status: true`
export async function toggleHabit(habitId: string, date: Date | string | number) {
  return HabitLog.toggleHabitForDate(habitId, date)
}

// Streak = continuous completed days from today backwards.
export async function calculateStreak(habitId: string, todayInput: Date | string | number = new Date()) {
  return HabitLog.calculateStreak(habitId, todayInput)
}

// successRate = (completedDays / totalTrackedDays) * 100
export async function calculateSuccessRate(habitId: string, year: number, month: number) {
  const { successRate } = await HabitLog.calculateSuccessRate(habitId, year, month)
  return successRate
}

// Monthly progress = completedDaysThisMonth / goalPerMonth * 100
export async function calculateMonthlyProgress(habitId: string, year: number, month: number) {
  const habit = await Habit.findById(habitId).select({ goalPerMonth: 1 }).lean()
  const goalPerMonth = habit?.goalPerMonth ?? 0
  if (goalPerMonth <= 0) return 0

  const completedDaysThisMonth = await HabitLog.countCompletedDaysInMonth(habitId, year, month)
  return (completedDaysThisMonth / goalPerMonth) * 100
}

// Extra Feature: Longest Streak (all-time based on ordered logs).
// Note: this follows the snippet you provided (it resets only when it encounters a `status: false` log).
export async function longestStreak(habitId: string) {
  const logs = await HabitLog.find({ habitId: new mongoose.Types.ObjectId(habitId) })
    .sort({ date: 1 })
    .select({ status: 1 })
    .lean()
    .exec()

  let longest = 0
  let current = 0
  for (const log of logs) {
    if (log.status) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

// Grid loads: get all logs for a habit for a month.
export async function getMonthlyLogs(habitId: string, year: number, month: number) {
  return HabitLog.getLogsForHabitForMonth(habitId, year, month)
}

