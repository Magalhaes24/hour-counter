'use client'

import React, { useState, useEffect } from 'react'
import { Download, Check, Pencil } from 'lucide-react'
import StatCard from '@/components/summary/StatCard'
import WeekGrid from '@/components/summary/WeekGrid'
import ProjectBreakdown from '@/components/summary/ProjectBreakdown'
import { getSummary, getTimesheetUrl, getSettings, updateSettings, type AppSettings } from '@/lib/api'
import { toISODate } from '@/lib/utils'
import type { SummaryReport } from '@/types'

export default function SummaryPage() {
  const [summary, setSummary] = useState<SummaryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Export state
  const today = toISODate(new Date())
  const [exportMonth, setExportMonth] = useState(today.slice(0, 7))

  // Settings state
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [editingSettings, setEditingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState<AppSettings>({
    employee_name: '',
    employee_code: '',
    department: '',
    supervisor_name: '',
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load summary.'))
      .finally(() => setLoading(false))

    getSettings()
      .then((s) => {
        setSettings(s)
        setSettingsForm(s)
      })
      .catch(() => {})
  }, [])

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch(getTimesheetUrl(exportMonth))
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition')
      const filename = disposition?.match(/filename="?([^";\n]+)"?/)?.[1]
        ?? `timesheet-${exportMonth}.xlsx`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleSettingsSave = async () => {
    setSettingsSaving(true)
    setSettingsError(null)
    try {
      const updated = await updateSettings(settingsForm)
      setSettings(updated)
      setEditingSettings(false)
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSettingsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded-lg bg-slate-800" />
        <div className="mb-4 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-slate-800/60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Summary</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Overview of your tracked hours.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Today" minutes={summary.today_minutes} highlight />
        <StatCard label="This Week" minutes={summary.week_minutes} />
        <StatCard label="This Month" minutes={summary.month_minutes} />
      </div>

      {/* Week grid */}
      <div className="mb-6">
        <WeekGrid
          dailyTotals={summary.daily_totals}
          anchorDate={summary.anchor_date}
        />
      </div>

      {/* Project breakdown */}
      <div className="mb-8">
        <ProjectBreakdown
          byProject={summary.by_project}
          weekTotal={summary.week_minutes}
        />
      </div>

      {/* Export section */}
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Export Timesheet</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Month</label>
            <input
              type="month"
              value={exportMonth}
              max={toISODate(new Date()).slice(0, 7)}
              onChange={(e) => setExportMonth(e.target.value)}
              className="h-9 rounded-lg border border-slate-800 bg-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex h-9 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export .xlsx'}
          </button>
        </div>
        {exportError && <p className="mt-2 text-xs text-rose-400">{exportError}</p>}
        <p className="mt-2 text-xs text-slate-600">Exports in the monthly timesheet format (TS###-YYMM.xlsx)</p>
      </div>

      {/* Settings section */}
      {settings && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Timesheet Settings</h3>
            {!editingSettings && (
              <button
                onClick={() => { setSettingsForm(settings); setEditingSettings(true); setSettingsError(null) }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
            {settingsSaved && !editingSettings && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>

          {editingSettings ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">Employee Name (B3)</label>
                  <input
                    type="text"
                    value={settingsForm.employee_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, employee_name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">Department (B4)</label>
                  <input
                    type="text"
                    value={settingsForm.department}
                    onChange={(e) => setSettingsForm({ ...settingsForm, department: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Department"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">Employee Code</label>
                  <input
                    type="text"
                    value={settingsForm.employee_code}
                    onChange={(e) => setSettingsForm({ ...settingsForm, employee_code: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 029"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">Supervisor Name</label>
                  <input
                    type="text"
                    value={settingsForm.supervisor_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supervisor_name: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Supervisor full name"
                  />
                </div>
              </div>
              {settingsError && <p className="text-xs text-rose-400">{settingsError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditingSettings(false); setSettingsError(null) }}
                  className="h-9 rounded-lg px-4 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettingsSave}
                  disabled={settingsSaving}
                  className="flex h-9 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {settingsSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <p className="text-xs text-slate-500">Employee Name (B3)</p>
                <p className="text-sm text-slate-200">{settings.employee_name || <span className="text-slate-600 italic">not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Department (B4)</p>
                <p className="text-sm text-slate-200">{settings.department || <span className="text-slate-600 italic">not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Employee Code</p>
                <p className="text-sm text-slate-200">{settings.employee_code || <span className="text-slate-600 italic">not set</span>}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Supervisor</p>
                <p className="text-sm text-slate-200">{settings.supervisor_name || <span className="text-slate-600 italic">not set</span>}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
