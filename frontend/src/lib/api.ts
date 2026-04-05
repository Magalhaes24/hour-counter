import type { Project, LogEntry, SummaryReport } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.detail ?? body?.message ?? JSON.stringify(body)
    } catch {
      message = await res.text()
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// ---- Projects ----

export async function getProjects(includeArchived = false): Promise<Project[]> {
  const res = await fetch(
    `${API_BASE}/api/projects?include_archived=${includeArchived}`,
    { cache: 'no-store' }
  )
  return handleResponse<Project[]>(res)
}

export async function createProject(data: { name: string; color?: string; code?: string | null }): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Project>(res)
}

export async function updateProject(
  id: number,
  data: Partial<{ name: string; color: string; code: string | null; archived: boolean }>
): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Project>(res)
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.detail ?? body?.message ?? JSON.stringify(body)
    } catch {
      message = await res.text()
    }
    throw new Error(message)
  }
}

// ---- Entries ----

export async function getEntries(params: {
  date?: string
  project_id?: number
  from_date?: string
  to_date?: string
}): Promise<LogEntry[]> {
  const qs = new URLSearchParams()
  if (params.date) qs.set('date', params.date)
  if (params.project_id != null) qs.set('project_id', String(params.project_id))
  if (params.from_date) qs.set('from_date', params.from_date)
  if (params.to_date) qs.set('to_date', params.to_date)

  const res = await fetch(`${API_BASE}/api/entries?${qs.toString()}`, {
    cache: 'no-store',
  })
  return handleResponse<LogEntry[]>(res)
}

export async function createEntry(data: {
  project_id: number
  entry_date: string
  duration_minutes?: number
  start_time?: string
  end_time?: string
  notes?: string
}): Promise<LogEntry> {
  const res = await fetch(`${API_BASE}/api/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<LogEntry>(res)
}

export async function updateEntry(
  id: number,
  data: Partial<{
    project_id: number
    entry_date: string
    duration_minutes: number
    start_time: string
    end_time: string
    notes: string
  }>
): Promise<LogEntry> {
  const res = await fetch(`${API_BASE}/api/entries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<LogEntry>(res)
}

export async function deleteEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/entries/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.detail ?? body?.message ?? JSON.stringify(body)
    } catch {
      message = await res.text()
    }
    throw new Error(message)
  }
}

// ---- Reports ----

export async function getSummary(date?: string): Promise<SummaryReport> {
  const qs = date ? `?date=${date}` : ''
  const res = await fetch(`${API_BASE}/api/reports/summary${qs}`, {
    cache: 'no-store',
  })
  return handleResponse<SummaryReport>(res)
}

export function getExportUrl(params: {
  from_date: string
  to_date: string
  project_id?: number
}): string {
  const qs = new URLSearchParams()
  qs.set('from_date', params.from_date)
  qs.set('to_date', params.to_date)
  if (params.project_id != null) qs.set('project_id', String(params.project_id))
  return `${API_BASE}/api/reports/export.csv?${qs.toString()}`
}

// ---- Settings ----

export interface AppSettings {
  employee_name: string
  employee_code: string
  department: string
  supervisor_name: string
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, { cache: 'no-store' })
  return handleResponse<AppSettings>(res)
}

export async function updateSettings(data: AppSettings): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<AppSettings>(res)
}

export function getTimesheetUrl(month: string): string {
  // month = "YYYY-MM"
  return `${API_BASE}/api/reports/export/timesheet?month=${month}`
}
