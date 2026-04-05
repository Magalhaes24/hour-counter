'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Folder, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/log',      label: 'Log',      icon: Clock },
  { href: '/projects', label: 'Projects', icon: Folder },
  { href: '/summary',  label: 'Summary',  icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-48 flex-col border-r border-slate-800/60 bg-slate-950 px-2 py-4">
      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '?')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-slate-500 hover:bg-slate-900 hover:text-slate-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3">
        <p className="text-[11px] text-slate-700">v0.1.0</p>
      </div>
    </aside>
  )
}
