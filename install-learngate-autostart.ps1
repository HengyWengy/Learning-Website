$ErrorActionPreference = "Stop"

$taskName = "LearnGate Local Server"
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$keeperPath = Join-Path $appDir "keep-learngate-online.ps1"
$powerShellExe = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"

$action = New-ScheduledTaskAction `
  -Execute $powerShellExe `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$keeperPath`""

$trigger = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Seconds 0) `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Keeps the local LearnGate server running after Windows login." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Write-Output "Installed and started scheduled task: $taskName"
