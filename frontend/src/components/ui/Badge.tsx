import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'muted'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        {
          'bg-blue-500/10 text-blue-400': variant === 'default',
          'bg-emerald-500/10 text-emerald-400': variant === 'success',
          'bg-rose-500/10 text-rose-400': variant === 'danger',
          'bg-slate-800 text-slate-400': variant === 'muted',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
