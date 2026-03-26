"use client"

import * as React from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area } from "recharts"
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

  const data = React.useMemo(() => {
    return days.map((day) => {
      const dateUtc = new Date(Date.UTC(year, month - 1, day))
      const dateKey = formatDateKeyUTC(dateUtc)

      let trackedCount = 0
      let doneCount = 0
      for (const h of habits) {
        const tracked = Object.prototype.hasOwnProperty.call(h.logs, dateKey)
        if (!tracked) continue
        trackedCount += 1
        if (h.logs[dateKey] === true) doneCount += 1
      }
      const rate = trackedCount === 0 ? 0 : (doneCount / trackedCount) * 100
      return { day, dateKey, rate }
    })
  }, [days, habits, month, year])

  return (
    <Card className="border border-zinc-800 bg-zinc-900/30 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-zinc-200">Monthly Performance</CardTitle>
            <div className="mt-1 text-xs text-zinc-400">Consistency across tracked days (month view).</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full min-h-[320px] h-[320px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <LineChart data={data}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="55%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" vertical={false} opacity={0.25} />
                <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${Math.round(v)}%`} />
                <Tooltip formatter={(value: unknown) => `${Math.round(Number(value))}%`} />
                <Area type="monotone" dataKey="rate" stroke="none" fill="url(#rateGradient)" />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
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

