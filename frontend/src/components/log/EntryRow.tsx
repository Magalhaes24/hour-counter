'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { updateEntry, deleteEntry } from '@/lib/api'
import { formatDuration, parseDuration } from '@/lib/utils'
import type { LogEntry, Project } from '@/types'

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

// Parse "HH:MM" → total minutes, or null if invalid
function timeToMinutes(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

interface EntryRowProps {
  entry: LogEntry
  projects: Project[]
  onDeleted: (id: number) => void
  onUpdated: (entry: LogEntry) => void
}

export default function EntryRow({ entry, projects, onDeleted, onUpdated }: EntryRowProps) {
  const [editing, setEditing] = useState(false)
  const [editProjectId, setEditProjectId] = useState(String(entry.project_id))
  const [editDuration, setEditDuration] = useState(formatDuration(entry.duration_minutes))
  const [editStartTime, setEditStartTime] = useState(entry.start_time ?? '')
  const [editEndTime, setEditEndTime] = useState(entry.end_time ?? '')
  const [editNotes, setEditNotes] = useState(entry.notes ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const project = projects.find((p) => p.id === entry.project_id)
  const colorHex = project ? resolveColor(project.color) : '#6366f1'

  // When both times are filled, auto-derive duration
  useEffect(() => {
    if (!editing) return
    const startMins = timeToMinutes(editStartTime)
    const endMins = timeToMinutes(editEndTime)
    if (startMins !== null && endMins !== null) {
      const diff = endMins >= startMins ? endMins - startMins : endMins + 1440 - startMins
      if (diff > 0) setEditDuration(formatDuration(diff))
    }
  }, [editStartTime, editEndTime, editing])

  const handleDelete = useCallback(async () => {
    try {
      await deleteEntry(entry.id)
      onDeleted(entry.id)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }, [entry.id, onDeleted])

  const handleSave = useCallback(async () => {
    const mins = parseDuration(editDuration)
    if (!mins || mins <= 0) {
      setEditError('Invalid duration')
      return
    }
    setSaving(true)
    setEditError(null)
    try {
      const payload: Parameters<typeof updateEntry>[1] = {
        project_id: parseInt(editProjectId, 10),
        duration_minutes: mins,
        notes: editNotes.trim() || undefined,
      }
      const startOk = editStartTime && timeToMinutes(editStartTime) !== null
      const endOk = editEndTime && timeToMinutes(editEndTime) !== null
      if (startOk && endOk) {
        payload.start_time = editStartTime
        payload.end_time = editEndTime
      } else if (!editStartTime && !editEndTime) {
        // Explicitly clear times when both are blanked out
        payload.start_time = undefined
        payload.end_time = undefined
      }
      const updated = await updateEntry(entry.id, payload)
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [entry.id, editProjectId, editDuration, editStartTime, editEndTime, editNotes, onUpdated])

  const handleCancel = useCallback(() => {
    setEditing(false)
    setEditProjectId(String(entry.project_id))
    setEditDuration(formatDuration(entry.duration_minutes))
    setEditStartTime(entry.start_time ?? '')
    setEditEndTime(entry.end_time ?? '')
    setEditNotes(entry.notes ?? '')
    setEditError(null)
  }, [entry])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  // Format created_at as time HH:MM
  const createdTime = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-blue-500/30 bg-slate-800/80 px-4 py-3 [&_input]:bg-slate-900 [&_input]:border-slate-700 [&_select]:bg-slate-900 [&_select]:border-slate-700">
        {/* Row 1: project + duration */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Select
              value={editProjectId}
              onChange={(e) => setEditProjectId(e.target.value)}
              onKeyDown={handleKeyDown}
            >
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <Input
            type="text"
            value={editDuration}
            onChange={(e) => {
              setEditDuration(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            className="w-28 font-mono"
            placeholder="Duration"
          />
        </div>

        {/* Row 2: start / end time */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0">Start</label>
            <Input
              type="time"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 font-mono"
            />
          </div>
          <span className="text-slate-600">–</span>
          <div className="flex flex-1 items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0">End</label>
            <Input
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 font-mono"
            />
          </div>
        </div>

        {/* Row 3: notes */}
        <Input
          type="text"
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Notes (optional)"
        />

        {editError && <p className="text-xs text-rose-400">{editError}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Check className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-slate-800/50">
      {/* Color dot */}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: colorHex }}
      />

      {/* Project + notes + time */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-200">
          {project?.name ?? 'Unknown project'}
        </span>
        {entry.notes && (
          <span className="text-xs text-slate-500 truncate block max-w-xs">
            {entry.notes.length > 60 ? entry.notes.slice(0, 60) + '…' : entry.notes}
          </span>
        )}
      </div>

      {/* Time range + duration */}
      <div className="flex items-center gap-2 shrink-0">
        {entry.start_time && entry.end_time ? (
          <span className="font-mono text-sm text-slate-400 tabular-nums">
            {entry.start_time} – {entry.end_time}
          </span>
        ) : createdTime ? (
          <span className="text-xs text-slate-600">{createdTime}</span>
        ) : null}
        <span className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
          {formatDuration(entry.duration_minutes)}
        </span>
      </div>

      {/* Actions — faintly visible at rest, full on hover */}
      <div className="flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditing(true)}
          title="Edit"
          className="h-7 w-7"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          title="Delete"
          className="h-7 w-7 text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
