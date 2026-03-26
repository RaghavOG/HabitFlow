"use client"

import * as React from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateKeyUTC } from "@/utils/date"

type DashboardHabit = {
  _id: string
  name: string
  color: string
  goalPerMonth: number
  completedDays: number
  successRate: number
  streak: number
  progress: number
  logs: Record<string, boolean>
}

function getDaysInMonth(year: number, month: number) {
  // month is 1-12
  return new Date(year, month, 0).getDate()
}

export default function MonthlyGraph({ habits, year, month }: { habits: DashboardHabit[]; year: number; month: number }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const days = React.useMemo(() => Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1), [year, month])

  // One line per habit (cumulative completed days this month).
  const data = React.useMemo(() => {
    const habitIds = habits.map((h) => h._id)
    const counts: Record<string, number> = Object.fromEntries(habitIds.map((id) => [id, 0]))

    return days.map((day) => {
      const dateUtc = new Date(Date.UTC(year, month - 1, day))
      const dateKey = formatDateKeyUTC(dateUtc)

      for (const h of habits) {
        if (h.logs[dateKey] === true) counts[h._id] = (counts[h._id] ?? 0) + 1
      }

      const row: Record<string, number | string> = { day, dateKey }
      for (const id of habitIds) row[id] = counts[id] ?? 0
      return row
    })
  }, [days, habits, month, year])

  return (
    <Card className="border border-zinc-800 bg-zinc-900/30 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-200">Monthly Performance</CardTitle>
            <div className="mt-1 text-xs text-zinc-400">Cumulative completed days per habit (month view).</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full min-h-[320px] h-[320px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="2 6" vertical={false} opacity={0.25} />
                <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis domain={[0, days.length]} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: unknown, key: unknown) => {
                    const habit = habits.find((h) => h._id === String(key))
                    const label = habit?.name ?? String(key)
                    return [Number(value), label]
                  }}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend
                  formatter={(value: unknown) => {
                    const habit = habits.find((h) => h._id === String(value))
                    return habit?.name ?? String(value)
                  }}
                />
                {habits.map((h) => (
                  <Line
                    key={h._id}
                    type="monotone"
                    dataKey={h._id}
                    stroke={h.color}
                    strokeWidth={2.2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-zinc-800/30" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

