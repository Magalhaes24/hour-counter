'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    const inElectron = !!window.electronAPI
    setIsElectron(inElectron)
    if (inElectron) window.electronAPI!.isMaximized().then(setMaximized)
  }, [])

  const handleMinimize = useCallback(() => window.electronAPI?.minimize(), [])
  const handleMaximize = useCallback(() => {
    window.electronAPI?.maximize()
    setMaximized((v) => !v)
  }, [])
  const handleClose = useCallback(() => window.electronAPI?.close(), [])

  return (
    <div
      className="flex h-9 w-full shrink-0 items-center justify-between select-none bg-slate-950 border-b border-slate-800/50"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* RV logo */}
      <div className="flex items-center gap-2.5 pl-4">
        <div className="flex h-5 w-7 items-center justify-center rounded border border-blue-900/40 bg-blue-950/50">
          <span className="text-[10px] font-bold tracking-tight text-slate-300">RV</span>
        </div>
        <span className="text-[11px] font-medium tracking-widest text-slate-600 uppercase">
          Hour Counter
        </span>
      </div>

      {/* Window controls — only shown inside Electron */}
      {isElectron && (
        <div
          className="flex h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="flex h-full w-11 items-center justify-center text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300"
            title="Minimize"
          >
            <Minus className="h-3 w-3" strokeWidth={2} />
          </button>
          <button
            onClick={handleMaximize}
            className="flex h-full w-11 items-center justify-center text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300"
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? (
              /* Restore icon — two overlapping squares */
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="2.5" y="0.5" width="8" height="8" rx="0.5" />
                <path d="M0.5 2.5v8a.5.5 0 0 0 .5.5h8" />
              </svg>
            ) : (
              <Square className="h-3 w-3" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={handleClose}
            className="flex h-full w-11 items-center justify-center text-slate-600 transition-colors hover:bg-rose-500 hover:text-white"
            title="Close"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
