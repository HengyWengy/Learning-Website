$ErrorActionPreference = "Continue"

$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeExe = "C:\Program Files\nodejs\node.exe"
$port = if ($env:PORT) { [int]$env:PORT } else { 8765 }
$logPath = Join-Path $appDir "learngate-keeper.log"

function Write-KeeperLog {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $logPath -Value "[$stamp] $Message"
}

Write-KeeperLog "LearnGate keeper started for $appDir on port $port."

while ($true) {
  try {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
      $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
      Write-KeeperLog "Port $port is already listening under PID $($listener.OwningProcess) ($($process.ProcessName)). Checking again in 30 seconds."
      Start-Sleep -Seconds 30
      continue
    }

    Write-KeeperLog "Starting LearnGate server."
    Push-Location $appDir
    & $nodeExe "server.js" *>> $logPath
    $exitCode = $LASTEXITCODE
    Pop-Location
    Write-KeeperLog "LearnGate server exited with code $exitCode. Restarting in 5 seconds."
  } catch {
    Write-KeeperLog "Keeper error: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds 5
}
