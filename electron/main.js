const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, execSync } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')
const os = require('os')

// Store Electron cache in AppData, not inside OneDrive (prevents GPU cache errors)
app.setPath('userData', path.join(os.homedir(), 'AppData', 'Roaming', 'HoursCounter'))
app.disableHardwareAcceleration()

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT         = path.join(__dirname, '..')
const BACKEND_DIR  = path.join(ROOT, 'backend')
const FRONTEND_DIR = path.join(ROOT, 'frontend')
const VENV_PYTHON  = path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe')
const LOG_DIR      = path.join(ROOT, 'logs')
const BACKEND_LOG  = path.join(LOG_DIR, 'backend.log')
const FRONTEND_LOG = path.join(LOG_DIR, 'frontend.log')
const ELECTRON_LOG = path.join(LOG_DIR, 'electron.log')

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  fs.appendFileSync(ELECTRON_LOG, line)
  console.log(msg)
}

let mainWindow = null
let splashWindow = null
let backendProc = null
let frontendProc = null

// ---------------------------------------------------------------------------
// Write a .bat launcher to %TEMP% (no spaces in path — avoids Windows issues)
// ---------------------------------------------------------------------------
function writeBat(name, lines) {
  const file = path.join(os.tmpdir(), name)
  fs.writeFileSync(file, lines.join('\r\n'), 'utf8')
  return file
}

// ---------------------------------------------------------------------------
// Spawn via cmd.exe — shell: false, windowsHide: true, output → logFile
// ---------------------------------------------------------------------------
function spawnBat(batFile, logFile) {
  log(`Launching: ${batFile}`)
  const out = fs.openSync(logFile, 'a')
  const proc = spawn('cmd.exe', ['/C', batFile], {
    stdio: ['ignore', out, out],
    windowsHide: true,
    detached: false,
    shell: false,
  })
  proc.on('error', (err) => log(`Spawn error (${batFile}): ${err.message}`))
  proc.on('exit',  (code) => log(`Exited (${batFile}): code ${code}`))
  return proc
}

function runBatAndWait(batFile) {
  return new Promise((resolve, reject) => {
    const p = spawn('cmd.exe', ['/C', batFile], {
      stdio: 'ignore', windowsHide: true, shell: false,
    })
    p.on('error', reject)
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Setup exited ${code}`))))
  })
}

// ---------------------------------------------------------------------------
// Kill a full process tree (Windows)
// ---------------------------------------------------------------------------
function killTree(proc) {
  if (!proc || proc.killed) return
  try { execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' }) } catch {}
}

// ---------------------------------------------------------------------------
// Poll until a port responds
// ---------------------------------------------------------------------------
function waitForPort(port, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/', timeout: 800 }, (res) => {
        res.destroy()
        log(`Port ${port} up (status ${res.statusCode})`)
        resolve()
      })
      req.on('error', () => {
        if (Date.now() > deadline) { reject(new Error(`Port ${port} timed out`)); return }
        setTimeout(check, 1000)
      })
      req.on('timeout', () => req.destroy())
    }
    setTimeout(check, 2000)
  })
}

// Wait until Next.js has compiled /log and returns 200 (not a redirect)
function waitForNextReady(timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      const req = http.get({ hostname: '127.0.0.1', port: 3000, path: '/log', timeout: 1500 }, (res) => {
        res.destroy()
        log(`/log → ${res.statusCode}`)
        if (res.statusCode === 200) { resolve(); return }
        if (Date.now() > deadline) { reject(new Error('Next.js compile timed out')); return }
        setTimeout(check, 1500)
      })
      req.on('error', () => {
        if (Date.now() > deadline) { reject(new Error('Next.js not responding')); return }
        setTimeout(check, 1500)
      })
      req.on('timeout', () => req.destroy())
    }
    setTimeout(check, 2000)
  })
}

// ---------------------------------------------------------------------------
// First-run setup (venv + npm install)
// ---------------------------------------------------------------------------
async function setup(onStatus) {
  if (!fs.existsSync(VENV_PYTHON)) {
    onStatus('Setting up Python environment…')
    log('Creating venv...')
    const setupBat = writeBat('hc_setup.bat', [
      '@echo off',
      `python -m venv "${path.join(BACKEND_DIR, '.venv')}"`,
      `"${VENV_PYTHON}" -m pip install -r "${path.join(BACKEND_DIR, 'requirements.txt')}" -q`,
    ])
    await runBatAndWait(setupBat)
  }
  if (!fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
    onStatus('Installing frontend packages…')
    log('Running npm install...')
    const npmBat = writeBat('hc_npm_install.bat', [
      '@echo off',
      `cd /d "${FRONTEND_DIR}"`,
      'npm install --silent',
    ])
    await runBatAndWait(npmBat)
  }
}

// ---------------------------------------------------------------------------
// Start servers
// ---------------------------------------------------------------------------
function startBackend() {
  log('Starting backend...')
  freePort(8000)
  const bat = writeBat('hc_backend.bat', [
    '@echo off',
    `cd /d "${BACKEND_DIR}"`,
    `"${VENV_PYTHON}" -m uvicorn main:app --port 8000`,
  ])
  backendProc = spawnBat(bat, BACKEND_LOG)
}

function freePort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
    const pids = [...new Set(
      out.split('\n')
        .filter(l => l.includes('LISTENING'))
        .map(l => l.trim().split(/\s+/).pop())
        .filter(Boolean)
    )]
    pids.forEach(pid => { try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }) } catch {} })
  } catch {}
}

function startFrontend() {
  log('Starting frontend...')
  freePort(3000)
  const cache = path.join(os.homedir(), '.cache', 'hours-counter-next')
  try { if (fs.existsSync(cache)) fs.rmSync(cache, { recursive: true, force: true }) } catch (e) { log(`Cache clear skipped: ${e.message}`) }
  const bat = writeBat('hc_frontend.bat', [
    '@echo off',
    `cd /d "${FRONTEND_DIR}"`,
    `set NODE_PATH=${path.join(FRONTEND_DIR, 'node_modules')}`,
    'npm run dev',
  ])
  frontendProc = spawnBat(bat, FRONTEND_LOG)
}

// ---------------------------------------------------------------------------
// Splash window
// ---------------------------------------------------------------------------
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 340, height: 180,
    frame: false, resizable: false,
    backgroundColor: '#020617',
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    alwaysOnTop: true, center: true, skipTaskbar: true,
  })
  splashWindow.loadURL(`data:text/html,<!DOCTYPE html>
<html><body style="background:#020617;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;user-select:none">
<div style="font-size:20px;font-weight:700;color:#e2e8f0;letter-spacing:-0.3px;margin-bottom:14px">Hour Counter</div>
<div id="s" style="font-size:13px">Starting…</div>
</body></html>`)
}

function setSplashStatus(msg) {
  log(`Status: ${msg}`)
  if (!splashWindow || splashWindow.isDestroyed()) return
  splashWindow.webContents.executeJavaScript(
    `document.getElementById('s').textContent = ${JSON.stringify(msg)}`
  ).catch(() => {})
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); splashWindow = null }
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------
function createMainWindow() {
  log('Opening main window...')
  Menu.setApplicationMenu(null)
  mainWindow = new BrowserWindow({
    width: 1280, height: 840,
    minWidth: 900, minHeight: 600,
    title: 'Hour Counter',
    backgroundColor: '#020617',
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  })
  mainWindow.loadURL('http://localhost:3000')
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => log(`Load failed: ${code} ${desc}`))
  mainWindow.once('ready-to-show', () => {
    log('Window ready')
    closeSplash()
    mainWindow.show()
    mainWindow.focus()
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function killAll() {
  log('Shutting down servers...')
  killTree(backendProc);  backendProc = null
  killTree(frontendProc); frontendProc = null
}

// ---------------------------------------------------------------------------
// Window control IPC
// ---------------------------------------------------------------------------
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.on('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

app.on('window-all-closed', () => { killAll(); app.quit() })
app.on('before-quit', killAll)

app.whenReady().then(async () => {
  log('=== App ready ===')
  createSplash()
  try {
    await setup(setSplashStatus)
    setSplashStatus('Starting backend…')
    startBackend()
    setSplashStatus('Starting frontend…')
    startFrontend()
    setSplashStatus('Waiting for backend…')
    await waitForPort(8000)
    setSplashStatus('Compiling frontend…')
    await waitForNextReady()
    createMainWindow()
  } catch (err) {
    log(`FATAL: ${err.message}`)
    closeSplash()
    const errWin = new BrowserWindow({ width: 520, height: 260, backgroundColor: '#09090b' })
    errWin.loadURL(`data:text/html,<body style="background:#020617;color:#f87171;font-family:sans-serif;padding:24px">
      <b style="color:#e2e8f0;font-size:15px">Failed to start Hour Counter</b><br><br>
      ${err.message}<br><br>
      <span style="color:#71717a;font-size:12px">See logs/electron.log for details</span></body>`)
    killAll()
  }
})
