# Hour Counter -- start both servers with no visible windows
param([switch]$NoBrowser)

$root    = $PSScriptRoot
$pidFile = Join-Path $root ".pids"
$logsDir = Join-Path $root "logs"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# -- Already running? ---------------------------------------------------------
if (Test-Path $pidFile) {
    $saved  = Get-Content $pidFile | ForEach-Object { [int]$_ }
    $alive  = $saved | Where-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }
    if ($alive) {
        if (-not $NoBrowser) { Start-Process "http://localhost:3000" }
        exit 0
    }
    Remove-Item $pidFile -Force
}

# -- Write launcher scripts to TEMP (avoids quoting hell in arguments) --------
$backendLog  = Join-Path $logsDir "backend.log"
$frontendLog = Join-Path $logsDir "frontend.log"

$backendScript = @"
`$root = '$($root.Replace("'","''"))'
Set-Location "`$root\backend"
if (-not (Test-Path '.venv')) { python -m venv .venv }
& ".venv\Scripts\Activate.ps1"
pip install -r requirements.txt -q *>> '$backendLog'
uvicorn main:app --port 8000 *>> '$backendLog' 2>&1
"@

$frontendScript = @"
`$root = '$($root.Replace("'","''"))'
Set-Location "`$root\frontend"
if (-not (Test-Path 'node_modules')) { npm install *>> '$frontendLog' 2>&1 }
Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
npm run dev *>> '$frontendLog' 2>&1
"@

$backendTmp  = Join-Path $env:TEMP "hc_backend.ps1"
$frontendTmp = Join-Path $env:TEMP "hc_frontend.ps1"
Set-Content $backendTmp  $backendScript  -Encoding UTF8
Set-Content $frontendTmp $frontendScript -Encoding UTF8

# -- Launch with CreateNoWindow = true (the only reliable way on Windows) -----
function Start-Hidden ([string]$ScriptPath) {
    $psi = [System.Diagnostics.ProcessStartInfo]::new("powershell.exe")
    $psi.Arguments       = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow  = $true
    return [System.Diagnostics.Process]::Start($psi)
}

$backend  = Start-Hidden $backendTmp
$frontend = Start-Hidden $frontendTmp

# -- Save PIDs ----------------------------------------------------------------
@($backend.Id, $frontend.Id) | Set-Content $pidFile

# -- Open browser -------------------------------------------------------------
if (-not $NoBrowser) {
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:3000"
}
