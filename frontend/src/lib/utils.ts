import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  // "2h30m", "2h 30m", "2h30", "2 h 30 m"
  const hhmm = trimmed.match(/^(\d+(?:\.\d+)?)\s*h\s*(\d+)(?:\s*m)?$/)
  if (hhmm) {
    const hours = parseFloat(hhmm[1])
    const mins = parseInt(hhmm[2], 10)
    return Math.round(hours * 60) + mins
  }

  // "2h", "2.5h"
  const hoursOnly = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/)
  if (hoursOnly) {
    return Math.round(parseFloat(hoursOnly[1]) * 60)
  }

  // "90m", "45m"
  const minsOnly = trimmed.match(/^(\d+)\s*m$/)
  if (minsOnly) {
    return parseInt(minsOnly[1], 10)
  }

  // "2:30"
  const colonTime = trimmed.match(/^(\d+):(\d{2})$/)
  if (colonTime) {
    return parseInt(colonTime[1], 10) * 60 + parseInt(colonTime[2], 10)
  }

  // Pure number: interpret as hours (e.g. "2" → 120, "2.5" → 150)
  const plain = trimmed.match(/^(\d+(?:\.\d+)?)$/)
  if (plain) {
    return Math.round(parseFloat(plain[1]) * 60)
  }

  return null
}

export function formatDate(dateStr: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  if (dateStr === toISO(today)) return 'Today'
  if (dateStr === toISO(yesterday)) return 'Yesterday'

  // Parse date parts directly to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
