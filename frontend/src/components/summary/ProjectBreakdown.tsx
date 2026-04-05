import React from 'react'
import { formatDuration } from '@/lib/utils'

const PROJECT_COLORS: Record<string, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  orange: '#f97316',
  pink: '#ec4899',
  lime: '#84cc16',
}

function resolveColor(color: string): string {
  return PROJECT_COLORS[color] ?? color
}

interface ByProject {
  project_id: number
  name: string
  color: string
  week_minutes: number
}

interface ProjectBreakdownProps {
  byProject: ByProject[]
  weekTotal: number
}

export default function ProjectBreakdown({ byProject, weekTotal }: ProjectBreakdownProps) {
  if (byProject.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 px-6 py-8 text-center">
        <p className="text-sm text-slate-500">No project activity this week.</p>
      </div>
    )
  }

  const sorted = [...byProject].sort((a, b) => b.week_minutes - a.week_minutes)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
          By Project — This Week
        </h3>
      </div>
      <div className="divide-y divide-slate-800/50">
        {sorted.map((item) => {
          const pct = weekTotal > 0 ? (item.week_minutes / weekTotal) * 100 : 0
          const colorHex = resolveColor(item.color)

          return (
            <div key={item.project_id} className="flex items-center gap-4 px-5 py-3.5">
              {/* Color dot */}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorHex }}
              />

              {/* Name + progress bar */}
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-slate-200 truncate">{item.name}</span>
                  <span className="ml-4 font-mono text-sm tabular-nums text-slate-400">
                    {formatDuration(item.week_minutes)}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: colorHex,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
