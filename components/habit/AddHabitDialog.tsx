"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { daysInMonthUTC } from "@/utils/date"

const PRESET_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#f43f5e"] as const

function clampInt(n: number, min: number, max: number) {
  const x = Math.trunc(Number.isFinite(n) ? n : min)
  return Math.max(min, Math.min(max, x))
}

export default function AddHabitDialog({
  onCreated,
  year,
  month,
}: {
  onCreated?: () => void
  year?: number
  month?: number // 1-12
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState("#22c55e")
  const [goalPerMonth, setGoalPerMonth] = React.useState<number>(20)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const maxDays = React.useMemo(() => {
    const now = new Date()
    const y = year ?? now.getUTCFullYear()
    const m = month ?? now.getUTCMonth() + 1
    return daysInMonthUTC(y, m)
  }, [month, year])

  React.useEffect(() => {
    setGoalPerMonth((g) => clampInt(g, 1, maxDays))
  }, [maxDays])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl">Add Habit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-zinc-800 bg-zinc-950/70 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Add Habit</DialogTitle>
          <DialogDescription>Create a new habit for the monthly grid.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Name</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Brush Morning"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Color</div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-zinc-800" style={{ backgroundColor: color }} />
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 rounded-xl p-1"
                aria-label="Pick a color"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 rounded-xl font-mono"
                placeholder="#22c55e"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => {
                const active = c.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    className={[
                      "h-8 w-8 rounded-xl border transition-transform",
                      active ? "border-zinc-200 ring-2 ring-zinc-200/20 scale-[1.03]" : "border-zinc-800 hover:scale-[1.03]",
                    ].join(" ")}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Set color ${c}`}
                  />
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">Goal (days/month)</div>
              <div className="text-xs text-zinc-500">1–{maxDays}</div>
            </div>
            <Input
              type="number"
              value={goalPerMonth}
              onChange={(e) => setGoalPerMonth(clampInt(Number(e.target.value), 1, maxDays))}
              min={1}
              max={maxDays}
              step={1}
              className="rounded-xl"
            />
          </div>

          <Button
            className="w-full rounded-xl"
            disabled={loading}
            onClick={async () => {
              setError(null)
              setLoading(true)
              try {
                const res = await fetch("/api/habits", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, color, goalPerMonth: clampInt(goalPerMonth, 1, maxDays) }),
                  credentials: "include",
                })
                const json = (await res.json()) as { error?: string }
                if (!res.ok) throw new Error(json.error || "Failed to create habit")
                setName("")
                setColor("#22c55e")
                setGoalPerMonth(clampInt(20, 1, maxDays))
                setOpen(false)
                onCreated?.()
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to create habit")
              } finally {
                setLoading(false)
              }
            }}
          >
            {loading ? (
              <>
                <Spinner className="mr-2" /> Creating...
              </>
            ) : (
              "Create Habit"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

