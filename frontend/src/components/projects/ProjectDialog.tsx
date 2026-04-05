'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createProject, updateProject } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

const PRESET_COLORS = [
  { name: 'indigo', hex: '#6366f1', label: 'Indigo' },
  { name: 'emerald', hex: '#10b981', label: 'Emerald' },
  { name: 'amber', hex: '#f59e0b', label: 'Amber' },
  { name: 'rose', hex: '#f43f5e', label: 'Rose' },
  { name: 'violet', hex: '#8b5cf6', label: 'Violet' },
  { name: 'cyan', hex: '#06b6d4', label: 'Cyan' },
]

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  onSaved: (project: Project) => void
}

export default function ProjectDialog({ open, onOpenChange, project, onSaved }: ProjectDialogProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(project?.name ?? '')
      setCode(project?.code ?? '')
      setColor(project?.color ?? '#6366f1')
      setError(null)
    }
  }, [open, project])

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Project name is required.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      let saved: Project
      if (project) {
        saved = await updateProject(project.id, { name: trimmedName, color, code: code.trim() || null })
      } else {
        saved = await createProject({ name: trimmedName, color, code: code.trim() || null })
      }
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project.')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Project Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Client Work, Personal, Learning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Code */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Project Code
            </label>
            <Input
              type="text"
              placeholder="e.g. PRJ2301.01 (optional)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Color swatches */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Color
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color === c.hex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
