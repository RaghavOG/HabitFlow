import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectToMongo } from "@/lib/mongodb"
import { getUserIdFromRequestCookie } from "@/lib/auth"
import { HabitModel } from "@/models/Habit"
import { HabitLogModel } from "@/models/HabitLog"
import { AIWeeklyReportModel } from "@/models/AIWeeklyReport"
import { getWeekRangeUTC } from "@/utils/date"

type WeeklyFacts = {
  weekKey: string
  streakMax: number
  habits: Array<{
    _id: string
    name: string
    goalPerMonth: number
    completedDays: number
    trackedDays: number
    weekendMissed: number
  }>
}

function computeFallbackBullets(facts: WeeklyFacts) {
  const bullets: string[] = []

  if (facts.streakMax >= 2) {
    bullets.push(`You’re on a ${facts.streakMax} day streak. Keep the momentum going.`)
  } else {
    bullets.push(`Start a streak this week—pick one habit and do it consistently.`)
  }

  const weekendMissed = facts.habits.reduce((sum, h) => sum + h.weekendMissed, 0)
  if (weekendMissed > 0) {
    bullets.push(`You missed a few habits on weekends. Try pre-planning a simple “Saturday + Sunday” routine.`)
  } else {
    bullets.push(`Weekend tracking looks strong. Keep your routine lightweight and repeatable.`)
  }

  const worstHabit = [...facts.habits].sort((a, b) => {
    const ar = a.trackedDays === 0 ? 0 : a.completedDays / a.trackedDays
    const br = b.trackedDays === 0 ? 0 : b.completedDays / b.trackedDays
    return ar - br
  })[0]

  if (worstHabit && worstHabit.trackedDays > 0) {
    const completionRate = worstHabit.completedDays / worstHabit.trackedDays
    if (completionRate < 0.55 && worstHabit.goalPerMonth >= 15) {
      const suggested = Math.max(1, Math.round(worstHabit.goalPerMonth * 0.75))
      bullets.push(`Suggestion: reduce ${worstHabit.name} goal from ${worstHabit.goalPerMonth} → ${suggested} for easier wins.`)
    } else {
      bullets.push(`You’re progressing well. Consider raising the difficulty slightly only after steady tracking.`)
    }
  } else {
    bullets.push(`Log a few more days so we can tailor better suggestions.`)
  }

  return bullets.slice(0, 3)
}

async function callOpenAIWeeklyReport(facts: WeeklyFacts): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  const prompt = `You are HabitFlow AI. Create exactly 3 concise bullet points for the weekly card.\n- Tone: friendly, motivational, product-like.\n- Bullets must reference the facts.\n- Don't mention OpenAI.\n\nFacts (JSON): ${JSON.stringify(facts)}\n\nReturn ONLY valid JSON: {"bullets":["...","...","..."]}.`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You generate strict JSON outputs." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  })

  if (!res.ok) return null

  const json = (await res.json()) as unknown
  const content = (json as { choices?: Array<{ message?: { content?: unknown } }> } | undefined)?.choices?.[0]?.message?.content
  if (typeof content !== "string") return null

  // content should be JSON; parse defensively.
  try {
    const parsed = JSON.parse(content) as { bullets?: string[] }
    if (!Array.isArray(parsed.bullets)) return null
    return parsed.bullets.slice(0, 3)
  } catch {
    return null
  }
}

export async function POST() {
  await connectToMongo()

  const userId = await getUserIdFromRequestCookie()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const { start: weekStart, endExclusive: weekEndExclusive, weekKey } = getWeekRangeUTC(now)
  const userObjectId = new mongoose.Types.ObjectId(userId)

  const existing = await AIWeeklyReportModel.findOne({ userId: userObjectId, weekKey }).lean()
  if (existing) {
    return NextResponse.json({ weekKey, bullets: existing.bullets })
  }

  type HabitDoc = {
    _id: mongoose.Types.ObjectId
    name: string
    color: string
    goalPerMonth: number
  }

  const habits = await (HabitModel as unknown as {
    getAllHabits: (userIdArg: mongoose.Types.ObjectId) => Promise<HabitDoc[]>
  }).getAllHabits(userObjectId)

  const habitIds = habits.map((h) => new mongoose.Types.ObjectId(h._id))
  if (!habitIds.length) {
    const facts: WeeklyFacts = { weekKey, streakMax: 0, habits: [] }
    const bullets = computeFallbackBullets(facts)
    const created = await AIWeeklyReportModel.create({ userId: userObjectId, weekKey, bullets })
    return NextResponse.json({ weekKey: created.weekKey, bullets: created.bullets })
  }

  // One query for week logs.
  const logs = await HabitLogModel.find({
    habitId: { $in: habitIds },
    date: { $gte: weekStart, $lt: weekEndExclusive },
  })
    .select({ habitId: 1, date: 1, status: 1 })
    .lean()
    .exec()

  const byHabit: Record<string, { completedDays: number; trackedDays: number; weekendMissed: number }> = {}
  for (const log of logs as Array<{ habitId: mongoose.Types.ObjectId; date: Date; status: boolean }>) {
    const id = String(log.habitId)
    if (!byHabit[id]) byHabit[id] = { completedDays: 0, trackedDays: 0, weekendMissed: 0 }
    byHabit[id].trackedDays += 1
    if (log.status) byHabit[id].completedDays += 1

    const utc = log.date
    const day = utc.getUTCDay() // 0 Sun..6 Sat
    const isWeekend = day === 0 || day === 6
    if (isWeekend && !log.status) byHabit[id].weekendMissed += 1
  }

  const streaks = await Promise.all(
    habits.map(async (h) => {
      type HabitLogStatics = {
        calculateStreak: (habitId: string | mongoose.Types.ObjectId, todayInput?: Date | string | number) => Promise<number>
      }
      const HabitLogWithStatics = HabitLogModel as unknown as mongoose.Model<unknown> & HabitLogStatics
      const streak = await HabitLogWithStatics.calculateStreak(h._id, now)
      return { habitId: String(h._id), streak: streak ?? 0 }
    })
  )

  const streakMax = streaks.reduce((max, s) => Math.max(max, s.streak), 0)

  const facts: WeeklyFacts = {
    weekKey,
    streakMax,
    habits: habits.map((h) => {
      const stats = byHabit[String(h._id)] ?? { completedDays: 0, trackedDays: 0, weekendMissed: 0 }
      return {
        _id: String(h._id),
        name: h.name as string,
        goalPerMonth: Number(h.goalPerMonth) || 0,
        completedDays: stats.completedDays,
        trackedDays: stats.trackedDays,
        weekendMissed: stats.weekendMissed,
      }
    }),
  }

  const bulletsFromAI = await callOpenAIWeeklyReport(facts)
  const bullets = bulletsFromAI ?? computeFallbackBullets(facts)

  const dailyMotivation = bullets[0] ?? ""
  const habitSuggestions = bullets[2] ?? ""
  const productivityTips = bullets[1] ?? ""
  const streakWarning =
    facts.streakMax >= 3
      ? ""
      : "Quick warning: weekends are a common break point. Plan a low-effort backup so you don’t miss two days in a row."

  const created = await AIWeeklyReportModel.create({
    userId: userObjectId,
    weekKey,
    bullets,
  })

  // Keep the output small.
  return NextResponse.json({
    weekKey: created.weekKey,
    bullets: created.bullets,
    dailyMotivation,
    habitSuggestions,
    productivityTips,
    streakWarning,
  })
}

