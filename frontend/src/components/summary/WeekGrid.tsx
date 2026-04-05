'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDuration, toISODate } from '@/lib/utils'

interface DayTotal {
  date: string
  minutes: number
}

interface WeekGridProps {
  dailyTotals: DayTotal[]
  anchorDate: string
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Get the Monday of the week containing the given date
function getWeekStart(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dow = d.getDay() // 0 = Sun, 1 = Mon, ...
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function WeekGrid({ dailyTotals, anchorDate }: WeekGridProps) {
  const router = useRouter()
  const todayStr = toISODate(new Date())

  const weekStart = getWeekStart(anchorDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const totalsByDate = new Map(dailyTotals.map((d) => [d.date, d.minutes]))

  const maxMinutes = Math.max(
    ...weekDays.map((d) => totalsByDate.get(toISODate(d)) ?? 0),
    1
  )

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Daily Activity
        </h3>
      </div>
      <div className="flex gap-1.5 p-4">
        {weekDays.map((date, i) => {
          const dateStr = toISODate(date)
          const minutes = totalsByDate.get(dateStr) ?? 0
          const isToday = dateStr === todayStr
          const isAnchor = dateStr === anchorDate
          const barPct = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0
          const dayNum = date.getDate()

          return (
            <button
              key={dateStr}
              onClick={() => router.push(`/log?date=${dateStr}`)}
              className={cn(
                'group flex flex-1 flex-col items-center gap-1.5 rounded-lg px-1 py-3 transition-colors',
                isToday
                  ? 'border border-blue-500/40 bg-blue-500/5'
                  : isAnchor
                  ? 'border border-slate-700 bg-slate-800/50'
                  : 'border border-transparent hover:bg-slate-800/50'
              )}
            >
              {/* Day label */}
              <span
                className={cn(
                  'text-xs font-medium',
                  isToday ? 'text-blue-400' : 'text-slate-500'
                )}
              >
                {DAY_LABELS[i]}
              </span>

              {/* Date number */}
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  isToday ? 'text-blue-300' : 'text-slate-300'
                )}
              >
                {dayNum}
              </span>

              {/* Bar area */}
              <div className="flex h-16 w-full items-end justify-center px-1">
                <div className="w-full rounded-t-sm overflow-hidden" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all duration-500',
                      isToday ? 'bg-blue-500' : 'bg-slate-700 group-hover:bg-slate-600'
                    )}
                    style={{
                      height: minutes > 0 ? `${Math.max(barPct, 8)}%` : '2px',
                      opacity: minutes > 0 ? 1 : 0.3,
                    }}
                  />
                </div>
              </div>

              {/* Duration */}
              <span
                className={cn(
                  'font-mono text-xs tabular-nums',
                  minutes > 0
                    ? isToday
                      ? 'text-blue-400'
                      : 'text-slate-400'
                    : 'text-slate-700'
                )}
              >
                {minutes > 0 ? formatDuration(minutes) : '—'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
