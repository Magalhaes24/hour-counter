# Hour Counter -- stop both servers
$root    = $PSScriptRoot
$pidFile = Join-Path $root ".pids"

if (-not (Test-Path $pidFile)) {
    Write-Host "Hour Counter does not appear to be running." -ForegroundColor Yellow
    exit 0
}

$pids = Get-Content $pidFile | ForEach-Object { [int]$_ }
$stopped = 0

foreach ($id in $pids) {
    $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $id -Force
        $stopped++
    }
}

Remove-Item $pidFile -Force

if ($stopped -gt 0) {
    Write-Host "Hour Counter stopped." -ForegroundColor Green
} else {
    Write-Host "No running processes found." -ForegroundColor Yellow
}
