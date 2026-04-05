interface ElectronAPI {
  minimize:    () => void
  maximize:    () => void
  close:       () => void
  isMaximized: () => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
