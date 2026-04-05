interface UpdateCheckResult {
  hasUpdate?: boolean
  current?: string
  latest?: string
  error?: string
}

interface ElectronAPI {
  minimize:          () => void
  maximize:          () => void
  close:             () => void
  isMaximized:       () => Promise<boolean>
  checkForUpdates:   () => Promise<UpdateCheckResult>
  applyUpdate:       () => Promise<{ success?: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
