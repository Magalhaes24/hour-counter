export interface Project {
  id: number
  name: string
  color: string
  code: string | null
  client: string | null
  archived: boolean
  created_at: string
}

export interface LogEntry {
  id: number
  project_id: number
  entry_date: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number
  notes: string | null
  created_at: string
}

export interface SummaryReport {
  anchor_date: string
  today_minutes: number
  week_minutes: number
  month_minutes: number
  by_project: Array<{
    project_id: number
    name: string
    color: string
    week_minutes: number
  }>
  daily_totals: Array<{ date: string; minutes: number }>
}
