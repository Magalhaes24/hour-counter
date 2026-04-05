'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createEntry, getProjects } from '@/lib/api'
import { parseDuration, formatDuration, formatDate, toISODate } from '@/lib/utils'
import type { Project } from '@/types'

const LAST_PROJECT_KEY = 'lastProjectId'

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

function timeToMins(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

interface QuickLogFormProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onSuccess: () => void
}

export default function QuickLogForm({ selectedDate, onDateChange, onSuccess }: QuickLogFormProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [duration, setDuration] = useState('')
  const [durationHint, setDurationHint] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const durationRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Load projects
  useEffect(() => {
    getProjects(false).then((list) => {
      setProjects(list)
      if (list.length > 0) {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(LAST_PROJECT_KEY) : null
        const savedId = saved ? parseInt(saved, 10) : null
        const validSaved = savedId && list.find((p) => p.id === savedId && !p.archived)
        setProjectId(validSaved ? String(savedId) : String(list[0].id))
      }
    }).catch(() => {})
  }, [])

  // Auto-compute duration from start/end times
  useEffect(() => {
    const s = timeToMins(startTime)
    const e = timeToMins(endTime)
    if (s !== null && e !== null) {
      const diff = e >= s ? e - s : e + 1440 - s
      if (diff > 0) {
        setDuration(formatDuration(diff))
        setDurationHint(null)
      }
    }
  }, [startTime, endTime])

  const handleDurationChange = (val: string) => {
    setDuration(val)
    setDurationHint(null)
  }

  const handleDurationBlur = useCallback(() => {
    if (!duration.trim()) { setDurationHint(null); return }
    const parsed = parseDuration(duration)
    if (parsed !== null) {
      setDurationHint(formatDuration(parsed))
    } else {
      setDurationHint('Try "2", "2.5", "2h30", "2:30"')
    }
  }, [duration])

  const handleSubmit = useCallback(async () => {
    if (!projectId) { setError('Please select a project.'); return }

    const durationMins = parseDuration(duration)
    if (!durationMins || durationMins <= 0) {
      setError('Please enter a valid duration.')
      durationRef.current?.focus()
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const s = timeToMins(startTime)
      const e = timeToMins(endTime)
      await createEntry({
        project_id: parseInt(projectId, 10),
        entry_date: selectedDate,
        duration_minutes: durationMins,
        ...(s !== null && e !== null ? { start_time: startTime, end_time: endTime } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })

      localStorage.setItem(LAST_PROJECT_KEY, projectId)
      setDuration('')
      setNotes('')
      setDurationHint(null)
      setStartTime('')
      setEndTime('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log entry.')
    } finally {
      setSubmitting(false)
    }
  }, [projectId, duration, selectedDate, startTime, endTime, notes, onSuccess])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  const selectedProject = projects.find((p) => String(p.id) === projectId)

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      {/* Date header */}
      <div className="mb-4 flex items-center gap-2">
        {showDatePicker ? (
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={toISODate(new Date())}
            onChange={(e) => { onDateChange(e.target.value); setShowDatePicker(false) }}
            onBlur={() => setShowDatePicker(false)}
            autoFocus
            className="h-7 rounded-md border border-slate-700 bg-slate-800 px-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => setShowDatePicker(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            title="Change date"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            {formatDate(selectedDate)}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* Row 1: Project */}
        <div className="relative">
          {selectedProject && (
            <span
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: resolveColor(selectedProject.color) }}
            />
          )}
          <Select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value)
              localStorage.setItem(LAST_PROJECT_KEY, e.target.value)
            }}
            className={selectedProject ? 'pl-7' : ''}
            onKeyDown={handleKeyDown}
          >
            {projects.length === 0 && <option value="">No projects — create one first</option>}
            {projects.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </Select>
        </div>

        {/* Row 2: Start – End – Duration */}
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 font-mono"
            title="Start time"
          />
          <span className="text-sm text-slate-600">–</span>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 font-mono"
            title="End time"
          />
          <span className="text-sm text-slate-600">=</span>
          <div className="flex-1">
            <Input
              ref={durationRef}
              type="text"
              placeholder="Duration"
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              onBlur={handleDurationBlur}
              onKeyDown={handleKeyDown}
              className="font-mono"
              title="Duration (e.g. 2h30)"
            />
            {durationHint && (
              <p className={`mt-0.5 text-xs ${durationHint.startsWith('Try') ? 'text-rose-400' : 'text-slate-500'}`}>
                {durationHint}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Notes + Submit */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a note (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || projects.length === 0}
            className="shrink-0"
          >
            {submitting ? 'Logging…' : 'Log'}
          </Button>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  )
}
