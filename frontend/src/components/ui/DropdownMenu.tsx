'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
})

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative" data-dropdown>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        setOpen(!open)
      },
    })
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setOpen(!open)
      }}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({
  children,
  className,
  align = 'end',
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
}) {
  const { open } = React.useContext(DropdownMenuContext)

  if (!open) return null

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[10rem] rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-xl',
        {
          'right-0': align === 'end',
          'left-0': align === 'start',
          'left-1/2 -translate-x-1/2': align === 'center',
        },
        'top-full mt-1',
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'danger'
}) {
  const { setOpen } = React.useContext(DropdownMenuContext)

  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        variant === 'danger'
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      onClick={() => {
        if (disabled) return
        onClick?.()
        setOpen(false)
      }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-slate-800', className)} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
