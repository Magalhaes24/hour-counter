'use client'

import React from 'react'
import ProjectCard from './ProjectCard'
import type { Project } from '@/types'

interface ProjectListProps {
  projects: Project[]
  weekMinutesByProject?: Record<number, number>
  onEdit: (project: Project) => void
  onChanged: (project: Project) => void
  onDeleted: (id: number) => void
}

export default function ProjectList({
  projects,
  weekMinutesByProject,
  onEdit,
  onChanged,
  onDeleted,
}: ProjectListProps) {
  const active = projects.filter((p) => !p.archived)
  const archived = projects.filter((p) => p.archived)

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
        <p className="text-sm text-slate-500">No projects yet. Create your first project.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active projects */}
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Projects ({active.length})
          </h2>
          <div className="flex flex-col gap-2">
            {active.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                weekMinutes={weekMinutesByProject?.[project.id]}
                onEdit={onEdit}
                onChanged={onChanged}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Archived projects */}
      {archived.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Archived ({archived.length})
          </h2>
          <div className="flex flex-col gap-2">
            {archived.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                weekMinutes={weekMinutesByProject?.[project.id]}
                onEdit={onEdit}
                onChanged={onChanged}
                onDeleted={onDeleted}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
