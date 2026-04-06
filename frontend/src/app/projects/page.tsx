'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import ProjectList from '@/components/projects/ProjectList'
import ProjectDialog from '@/components/projects/ProjectDialog'
import { getProjects, getSummary } from '@/lib/api'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [weekMinutes, setWeekMinutes] = useState<Record<number, number>>({})

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, summary] = await Promise.all([
        getProjects(true),
        getSummary().catch(() => null),
      ])
      setProjects(list)
      if (summary) {
        const map: Record<number, number> = {}
        summary.by_project.forEach((bp) => {
          map[bp.project_id] = bp.week_minutes
        })
        setWeekMinutes(map)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleOpenCreate = () => {
    setEditingProject(null)
    setDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleSaved = (saved: Project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  const handleChanged = (changed: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === changed.id ? changed : p)))
  }

  const handleDeleted = (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Projects</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage your projects and track time by category.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      ) : (
        <ProjectList
          projects={projects}
          weekMinutesByProject={weekMinutes}
          onEdit={handleEdit}
          onChanged={handleChanged}
          onDeleted={handleDeleted}
        />
      )}

      {/* FAB */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        title="New Project"
      >
        <Plus className="h-5 w-5" />
      </button>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSaved={handleSaved}
        existingClients={[...new Set(projects.map((p) => p.client).filter(Boolean) as string[])]}
      />
    </div>
  )
}
