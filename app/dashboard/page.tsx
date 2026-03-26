"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import HabitGrid from "@/components/habit/HabitGrid"
import MonthlyGraph from "@/components/habit/MonthlyGraph"
import AddHabitDialog from "@/components/habit/AddHabitDialog"
import HabitActionsMenu from "@/components/habit/HabitActionsMenu"
import DashboardCards from "@/components/dashboard/DashboardCards"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  optimisticMarkDoneHabitDay,
  optimisticToggleHabitDay,
  setDashboardMonthHabits,
} from "@/lib/redux/dashboardSlice"
import type { DashboardHabit } from "@/lib/redux/dashboardSlice"
import { formatDateKeyUTC, toStartOfDayUTC } from "@/utils/date"
import { CalendarCheck2, Flame, RotateCcw, BarChart2 } from "lucide-react"
import AIInsightsCard from "@/components/ai/AIInsightsCard"
import { toast } from "sonner"

function monthLabel(year: number, month1to12: number) {
  const d = new Date(Date.UTC(year, month1to12 - 1, 1))
  return d.toLocaleString(undefined, { month: "long", year: "numeric" })
}

const EMPTY_HABITS: DashboardHabit[] = []
const SHOW_MORNING_ROUTINE_BUTTON = true

export default function DashboardPage() {
  const [showMotivation, setShowMotivation] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true
    const v = window.localStorage.getItem("hf_show_motivation")
    return v === null ? true : v === "true"
  })

  const [showAIInsights, setShowAIInsights] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true
    const v = window.localStorage.getItem("hf_show_ai_insights")
    return v === null ? true : v === "true"
  })

  React.useEffect(() => {
    window.localStorage.setItem("hf_show_motivation", String(showMotivation))
  }, [showMotivation])

  React.useEffect(() => {
    window.localStorage.setItem("hf_show_ai_insights", String(showAIInsights))
  }, [showAIInsights])

  const [monthCursor, setMonthCursor] = React.useState(() => new Date())
  const year = monthCursor.getUTCFullYear()
  const month = monthCursor.getUTCMonth() + 1 // 1-12
  const monthKey = `${year}-${month}`

  const dispatch = useAppDispatch()

  const persistedHabits = useAppSelector((s) => s.dashboard.habitsByMonthKey[monthKey])
  const hasMonthData = persistedHabits !== undefined
  const habits: DashboardHabit[] = persistedHabits ?? EMPTY_HABITS
  const displayHabits = React.useMemo(() => [...habits].reverse(), [habits])

  const [authRequired, setAuthRequired] = React.useState(false)
  const [loadingInitial, setLoadingInitial] = React.useState(false)

  const fetchDashboard = React.useCallback(
    async (opts: { showSpinner: boolean }) => {
      if (opts.showSpinner) setLoadingInitial(true)
      try {
        const res = await fetch(`/api/dashboard?year=${year}&month=${month}`, {
          cache: "no-store",
          credentials: "include",
        })

        if (res.status === 401) {
          setAuthRequired(true)
          dispatch(setDashboardMonthHabits({ monthKey, habits: [] }))
          return
        }
        if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`)

        const json = (await res.json()) as { habits: DashboardHabit[] }
        setAuthRequired(false)
        dispatch(setDashboardMonthHabits({ monthKey, habits: json.habits ?? [] }))
      } finally {
        setLoadingInitial(false)
      }
    },
    [dispatch, monthKey, month, year]
  )

  React.useEffect(() => {
    void fetchDashboard({ showSpinner: !hasMonthData })
  }, [fetchDashboard, hasMonthData])

  // Clerk middleware handles redirects; keep authRequired only for rendering state.

  const toggleHabit = React.useCallback(
    async (habitId: string, dateKey: string) => {
      dispatch(optimisticToggleHabitDay({ habitId, dateKey }))
      await fetch("/api/logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: dateKey }),
        credentials: "include",
      })
      void fetchDashboard({ showSpinner: false })
    },
    [dispatch, fetchDashboard]
  )

  const markDone = React.useCallback(
    async (habitId: string, dateKey: string) => {
      dispatch(optimisticMarkDoneHabitDay({ habitId, dateKey }))
      await fetch("/api/logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: dateKey }),
        credentials: "include",
      })
      void fetchDashboard({ showSpinner: false })
    },
    [dispatch, fetchDashboard]
  )

  const overall = React.useMemo(() => {
    const completed = habits.reduce((sum, h) => sum + h.completedDays, 0)
    const tracked = habits.reduce((sum, h) => sum + Object.keys(h.logs).length, 0)
    const successRate = tracked === 0 ? 0 : (completed / tracked) * 100
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0)
    return { completed, tracked, successRate, longestStreak }
  }, [habits])

  const todayKey = React.useMemo(() => {
    return formatDateKeyUTC(toStartOfDayUTC(new Date()))
  }, [])

  const analyticsRef = React.useRef<HTMLDivElement | null>(null)

  const markAllToday = React.useCallback(async () => {
    if (!habits.length) return
    const toUpdate = habits.filter((h) => h.logs[todayKey] !== true)
    if (!toUpdate.length) return

    for (const h of toUpdate) {
      dispatch(optimisticMarkDoneHabitDay({ habitId: h._id, dateKey: todayKey }))
    }

    await Promise.all(
      toUpdate.map((h) =>
        fetch("/api/logs/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId: h._id, date: todayKey }),
          credentials: "include",
        })
      )
    )

    void fetchDashboard({ showSpinner: false })
  }, [dispatch, fetchDashboard, habits, todayKey])

  const resetMonth = React.useCallback(async () => {
    dispatch(setDashboardMonthHabits({ monthKey, habits: [] }))
    await fetch(`/api/logs/reset-month?year=${year}&month=${month}`, {
      method: "DELETE",
      credentials: "include",
    })
    void fetchDashboard({ showSpinner: false })
  }, [dispatch, fetchDashboard, month, monthKey, year])

  const [seedingRoutine, setSeedingRoutine] = React.useState(false)
  const seedMorningRoutine = React.useCallback(async () => {
    setSeedingRoutine(true)
    try {
      const res = await fetch("/api/habits/seed-morning-routine", { method: "POST", credentials: "include" })
      const json = (await res.json()) as { error?: string; created?: number; skipped?: number }
      if (!res.ok) throw new Error(json.error || "Failed to add routine habits")
      toast.success(`Added ${json.created ?? 0} habits${(json.skipped ?? 0) > 0 ? ` (skipped ${json.skipped})` : ""}`)
      void fetchDashboard({ showSpinner: false })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add routine habits")
    } finally {
      setSeedingRoutine(false)
    }
  }, [fetchDashboard])

  const motivation = React.useMemo(() => {
    if (!habits.length) return { streakText: "Start a habit today", weekdayText: "", goalText: "" }

    const longest = overall.longestStreak
    const streakText = longest >= 3 ? `You're on a ${longest} day streak!` : "Keep going—consistency beats intensity."

    const weekdayCounts = Array.from({ length: 7 }, () => 0)
    for (const h of habits) {
      for (const [dateKey, done] of Object.entries(h.logs)) {
        if (!done) continue
        const d = new Date(`${dateKey}T00:00:00Z`)
        if (Number.isNaN(d.getTime())) continue
        weekdayCounts[d.getUTCDay()] += 1
      }
    }
    const maxIdx = weekdayCounts.reduce((best, v, idx) => (v > weekdayCounts[best] ? idx : best), 0)
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
    const weekdayText = weekdayCounts[maxIdx] > 0 ? `You are most consistent on ${weekdayNames[maxIdx]}s.` : "Complete a few days to unlock insights."

    const totalGoal = habits.reduce((sum, h) => sum + h.goalPerMonth, 0)
    const remainingDays = Math.max(0, totalGoal - overall.completed)
    const goalText = remainingDays > 0 ? `Complete ${remainingDays} more day${remainingDays === 1 ? "" : "s"} to reach your goal.` : "Goal reached. Now protect your streak."

    return { streakText, weekdayText, goalText }
  }, [habits, overall.completed, overall.longestStreak])

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthCursor(new Date(Date.UTC(year, month - 2, 1)))}
            disabled={loadingInitial}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthCursor(new Date(Date.UTC(year, month, 1)))}
            disabled={loadingInitial}
          >
            Next
          </Button>
          {!authRequired && <AddHabitDialog year={year} month={month} onCreated={() => void fetchDashboard({ showSpinner: true })} />}
          {!authRequired && SHOW_MORNING_ROUTINE_BUTTON ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60"
              disabled={seedingRoutine}
              onClick={() => void seedMorningRoutine()}
            >
              {seedingRoutine ? "Adding Routine..." : "Add Morning Routine Pack"}
            </Button>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">{monthLabel(year, month)}</div>
      </div>

      <DashboardCards
        successRate={overall.successRate}
        currentStreak={overall.longestStreak}
        completed={overall.completed}
        tracked={overall.tracked}
      />

      {loadingInitial && habits.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Spinner className="mr-2" />
          Loading dashboard...
        </div>
      ) : authRequired ? (
        <Card className="bg-card/70">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm space-y-3">
            <div>Go to the sign in page to continue.</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : habits.length === 0 ? (
        <Card className="bg-card/70">
          <CardHeader>
            <CardTitle>No habits yet</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Create habits and start tracking in the matrix.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <AddHabitDialog year={year} month={month} onCreated={() => void fetchDashboard({ showSpinner: false })} />

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60"
                  onClick={() => void markAllToday()}
                >
                  <CalendarCheck2 className="size-4 mr-2 text-emerald-400" />
                  Mark All Today
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60"
                  onClick={() => void resetMonth()}
                >
                  <RotateCcw className="size-4 mr-2 text-zinc-300" />
                  Reset Month
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  <BarChart2 className="size-4 mr-2" />
                  View Analytics
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60"
                  onClick={() => setShowMotivation((v) => !v)}
                >
                  <Flame className="size-4 mr-2 text-emerald-400" />
                  Motivation: {showMotivation ? "On" : "Off"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60"
                  onClick={() => setShowAIInsights((v) => !v)}
                >
                  AI Insights: {showAIInsights ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-300">
                {displayHabits.map((h) => (
                  <div key={h._id} className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: h.color }} />
                    <span className="whitespace-nowrap">{h.name}</span>
                    <HabitActionsMenu
                      habit={{ _id: h._id, name: h.name, color: h.color, goalPerMonth: h.goalPerMonth }}
                      year={year}
                      month={month}
                      onSaved={() => void fetchDashboard({ showSpinner: false })}
                      onDeleted={() => void fetchDashboard({ showSpinner: false })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <HabitGrid habits={displayHabits} year={year} month={month} onToggleHabit={toggleHabit} onMarkDone={markDone} />
          </div>

          <div className="space-y-6">
            <div ref={analyticsRef}>
              <MonthlyGraph habits={displayHabits} year={year} month={month} />
            </div>

            {showMotivation ? (
              <Card className="border-zinc-800 bg-zinc-900/30 shadow-sm rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Flame className="size-4 text-emerald-400" />
                    Motivation / Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-zinc-200">{motivation.streakText}</div>
                  {motivation.weekdayText ? <div className="text-zinc-400">{motivation.weekdayText}</div> : null}
                  {motivation.goalText ? <div className="text-zinc-400">{motivation.goalText}</div> : null}
                </CardContent>
              </Card>
            ) : null}

            <AIInsightsCard enabled={showAIInsights} />
          </div>
        </div>
      )}
    </main>
  )
}

