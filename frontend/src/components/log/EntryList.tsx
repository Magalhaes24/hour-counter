'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getEntries, getProjects } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import EntryRow from './EntryRow'
import type { LogEntry, Project } from '@/types'

interface EntryListProps {
  selectedDate: string
  refreshKey: number
}

export default function EntryList({ selectedDate, refreshKey }: EntryListProps) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [fetchedEntries, fetchedProjects] = await Promise.all([
        getEntries({ date: selectedDate }),
        getProjects(true), // include archived so old entries still show names
      ])
      setEntries(fetchedEntries)
      setProjects(fetchedProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries.')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleDeleted = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleUpdated = useCallback((updated: LogEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }, [])

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)

  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-slate-800/60"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-800 px-6 py-10 text-center">
        <p className="text-sm text-slate-500">
          No entries yet. Log your first hours above.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs text-slate-500">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
        <span className="font-mono text-xs font-medium text-slate-400 tabular-nums">
          {formatDuration(totalMinutes)} total
        </span>
      </div>

      {/* Entry rows */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/60 overflow-hidden">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            projects={projects}
            onDeleted={handleDeleted}
            onUpdated={handleUpdated}
          />
        ))}
      </div>
    </div>
  )
}
