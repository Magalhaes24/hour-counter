import React from 'react'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  minutes: number
  highlight?: boolean
  className?: string
}

export default function StatCard({ label, minutes, highlight = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-slate-900 px-5 py-5',
        highlight ? 'border-blue-500/30' : 'border-slate-800',
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight',
          highlight ? 'text-blue-400' : 'text-slate-100'
        )}
      >
        {formatDuration(minutes)}
      </p>
    </div>
  )
}
