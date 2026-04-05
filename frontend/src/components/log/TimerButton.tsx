'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Square } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { createEntry, getProjects } from '@/lib/api'
import { toISODate } from '@/lib/utils'
import type { Project } from '@/types'

const LS_RUNNING    = 'timer_running'
const LS_START      = 'timer_start'
const LS_PROJECT_ID = 'timer_project_id'
const LS_NOTES      = 'timer_notes'
const LAST_PROJECT  = 'lastProjectId'

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface TimerButtonProps {
  onSuccess: () => void
}

export default function TimerButton({ onSuccess }: TimerButtonProps) {
  const [projects, setProjects]     = useState<Project[]>([])
  const [projectId, setProjectId]   = useState<string>('')
  const [isRunning, setIsRunning]   = useState(false)
  const [startTs, setStartTs]       = useState<number | null>(null)
  const [elapsed, setElapsed]       = useState(0)
  const [notes, setNotes]           = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [justLogged, setJustLogged] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load projects
  useEffect(() => {
    getProjects(false).then((list) => {
      setProjects(list)
      if (list.length === 0) return
      const saved = localStorage.getItem(LAST_PROJECT)
      const savedId = saved ? parseInt(saved, 10) : null
      const valid = savedId && list.find((p) => p.id === savedId && !p.archived)
      const defaultId = valid ? String(savedId) : String(list[0].id)

      // Restore timer state from localStorage
      const running = localStorage.getItem(LS_RUNNING) === 'true'
      const savedStart = localStorage.getItem(LS_START)
      const savedProject = localStorage.getItem(LS_PROJECT_ID)
      const savedNotes = localStorage.getItem(LS_NOTES) ?? ''

      if (running && savedStart) {
        const ts = parseInt(savedStart, 10)
        setStartTs(ts)
        setIsRunning(true)
        setElapsed(Math.floor((Date.now() - ts) / 1000))
        setProjectId(savedProject ?? defaultId)
        setNotes(savedNotes)
      } else {
        setProjectId(defaultId)
      }
    }).catch(() => {})
  }, [])

  // Tick
  useEffect(() => {
    if (isRunning && startTs !== null) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTs) / 1000))
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, startTs])

  const handleStart = useCallback(() => {
    if (!projectId) { setError('Select a project first.'); return }
    const now = Date.now()
    setStartTs(now)
    setIsRunning(true)
    setElapsed(0)
    setError(null)
    setJustLogged(false)
    localStorage.setItem(LS_RUNNING, 'true')
    localStorage.setItem(LS_START, String(now))
    localStorage.setItem(LS_PROJECT_ID, projectId)
    localStorage.setItem(LS_NOTES, notes)
    localStorage.setItem(LAST_PROJECT, projectId)
  }, [projectId, notes])

  const handleStop = useCallback(async () => {
    if (!startTs) return
    if (intervalRef.current) clearInterval(intervalRef.current)

    const durationMinutes = Math.max(1, Math.round(elapsed / 60))
    const entryDate = toISODate(new Date(startTs))
    const startHH = new Date(startTs).toTimeString().slice(0, 5)
    const endHH   = new Date().toTimeString().slice(0, 5)

    setSaving(true)
    setError(null)
    try {
      await createEntry({
        project_id: parseInt(projectId, 10),
        entry_date: entryDate,
        duration_minutes: durationMinutes,
        start_time: startHH,
        end_time: endHH,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })

      // Clear timer state
      localStorage.removeItem(LS_RUNNING)
      localStorage.removeItem(LS_START)
      localStorage.removeItem(LS_PROJECT_ID)
      localStorage.removeItem(LS_NOTES)

      setIsRunning(false)
      setStartTs(null)
      setElapsed(0)
      setNotes('')
      setJustLogged(true)
      setTimeout(() => setJustLogged(false), 3000)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log entry.')
    } finally {
      setSaving(false)
    }
  }, [startTs, elapsed, projectId, notes, onSuccess])

  const handleProjectChange = (id: string) => {
    setProjectId(id)
    if (isRunning) localStorage.setItem(LS_PROJECT_ID, id)
    localStorage.setItem(LAST_PROJECT, id)
  }

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (isRunning) localStorage.setItem(LS_NOTES, val)
  }

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      isRunning ? 'border-blue-500/40 bg-blue-950/20' : 'border-slate-800 bg-slate-900'
    }`}>
      <div className="flex flex-col gap-4">

        {/* Top row: project + elapsed */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={isRunning}
            >
              {projects.length === 0 && (
                <option value="">No projects — create one first</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </Select>
          </div>

          {/* Elapsed time */}
          {isRunning && (
            <span className="font-mono text-2xl font-semibold tabular-nums text-blue-300 min-w-[5rem] text-right">
              {formatElapsed(elapsed)}
            </span>
          )}
        </div>

        {/* Notes (always visible so user can type while working) */}
        <Input
          type="text"
          placeholder="What are you working on? (optional)"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
        />

        {/* Start / Stop button */}
        <button
          onClick={isRunning ? handleStop : handleStart}
          disabled={saving || projects.length === 0}
          className={`flex w-full items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
            isRunning
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          }`}
        >
          {saving ? (
            <span>Logging…</span>
          ) : isRunning ? (
            <>
              <Square className="h-4 w-4 fill-current" />
              Stop & Log
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              Start
            </>
          )}
        </button>

        {error && <p className="text-xs text-rose-400">{error}</p>}
        {justLogged && <p className="text-xs text-emerald-400">Logged.</p>}
      </div>
    </div>
  )
}
