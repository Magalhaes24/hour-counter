# Creates a desktop shortcut for Hour Counter
$projectRoot = $PSScriptRoot
$batFile = Join-Path $projectRoot "Start Hour Counter.vbs"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Hour Counter.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batFile
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = "Start Hour Counter"
$shortcut.IconLocation = "shell32.dll,175"  # clock icon
$shortcut.Save()

Write-Host ""
Write-Host "  Shortcut created on Desktop: 'Hour Counter'" -ForegroundColor Green
Write-Host ""
