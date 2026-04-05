'use client'

import React, { useState } from 'react'
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { updateProject, deleteProject } from '@/lib/api'
import type { Project } from '@/types'

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

interface ProjectCardProps {
  project: Project
  weekMinutes?: number
  onEdit: (project: Project) => void
  onChanged: (project: Project) => void
  onDeleted: (id: number) => void
}

export default function ProjectCard({
  project,
  weekMinutes,
  onEdit,
  onChanged,
  onDeleted,
}: ProjectCardProps) {
  const [actionError, setActionError] = useState<string | null>(null)

  const colorHex = resolveColor(project.color)

  const handleArchiveToggle = async () => {
    setActionError(null)
    try {
      const updated = await updateProject(project.id, { archived: !project.archived })
      onChanged(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update project.')
    }
  }

  const handleDelete = async () => {
    setActionError(null)
    try {
      await deleteProject(project.id)
      onDeleted(project.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete project.'
      setActionError(msg)
    }
  }

  const formatWeekHours = (mins?: number) => {
    if (mins == null) return null
    if (mins === 0) return '0h this week'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const parts = []
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    return `${parts.join(' ')} this week`
  }

  return (
    <div className="group relative flex overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-colors hover:border-slate-700">
      {/* Color bar on left edge */}
      <div
        className="w-1 shrink-0 self-stretch"
        style={{ backgroundColor: colorHex }}
      />

      {/* Clickable main body → opens edit */}
      <button
        className="flex flex-1 min-w-0 items-center gap-3 px-4 py-4 text-left"
        onClick={() => onEdit(project)}
      >
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-100 truncate">
              {project.name}
            </span>
            {project.code && (
              <span className="font-mono text-xs text-slate-500 shrink-0">{project.code}</span>
            )}
            {project.archived && (
              <Badge variant="muted">Archived</Badge>
            )}
          </div>
          {weekMinutes != null && (
            <span className="text-xs text-slate-500 tabular-nums">
              {formatWeekHours(weekMinutes)}
            </span>
          )}
          {actionError && (
            <span className="mt-1 text-xs text-rose-400">{actionError}</span>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 pr-3">
        {/* Quick edit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onEdit(project)}
          title="Edit project"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        {/* Three-dot menu — visible at reduced opacity always */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-40 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchiveToggle}>
              {project.archived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
