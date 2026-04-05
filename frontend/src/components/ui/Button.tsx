'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700': variant === 'default',
            'border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800': variant === 'outline',
            'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100': variant === 'ghost',
            'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20': variant === 'danger',
            'bg-transparent text-blue-400 hover:underline p-0 h-auto': variant === 'link',
          },
          {
            'h-7 px-2.5 text-xs': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
