<#
.SYNOPSIS
  Start, stop, or check an `obscura serve` CDP server as a detached
  background process (not a Windows Service - just Start-Process + a PID
  file, which is enough for local agent/automation use).

.PARAMETER Start
  Launch obscura serve detached. Fails loudly if already running on that
  port, or if a stale PID file points at a dead process (which it cleans up).

.PARAMETER Stop
  Stop the process recorded in the PID file.

.PARAMETER Status
  Report whether it's running and on which port.

.PARAMETER Port
  CDP port. Default 9222.

.PARAMETER NoStealth
  Stealth is ON by default (owner's standing preference). Pass -NoStealth
  only when the user explicitly asks to run without it.

.PARAMETER ObscuraExe
  Path to obscura.exe. Default: resolved from PATH, else
  %LOCALAPPDATA%\obscura\obscura.exe.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File run-server.ps1 -Start
  powershell -ExecutionPolicy Bypass -File run-server.ps1 -Start -Port 9333
  powershell -ExecutionPolicy Bypass -File run-server.ps1 -Start -NoStealth
  powershell -ExecutionPolicy Bypass -File run-server.ps1 -Status
  powershell -ExecutionPolicy Bypass -File run-server.ps1 -Stop
#>
param(
  [switch]$Start,
  [switch]$Stop,
  [switch]$Status,
  [int]$Port = 9222,
  [switch]$NoStealth,
  [string]$ObscuraExe
)

$ErrorActionPreference = "Stop"
$stateDir = Join-Path $env:LOCALAPPDATA "obscura\run"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$pidFile = Join-Path $stateDir "server-$Port.pid"
$logFile = Join-Path $stateDir "server-$Port.log"

function Resolve-Obscura {
  if ($ObscuraExe) { return $ObscuraExe }
  $cmd = Get-Command obscura -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $fallback = Join-Path $env:LOCALAPPDATA "obscura\obscura.exe"
  if (Test-Path $fallback) { return $fallback }
  throw "obscura.exe not found on PATH or at $fallback. Run setup_windows.ps1 first."
}

function Get-RunningProc {
  if (-not (Test-Path $pidFile)) { return $null }
  $procId = Get-Content $pidFile -ErrorAction SilentlyContinue
  if (-not $procId) { return $null }
  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if ($proc -and $proc.ProcessName -like "obscura*") { return $proc }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue  # stale
  return $null
}

if ($Status) {
  $proc = Get-RunningProc
  if ($proc) {
    Write-Output "RUNNING: obscura serve on port $Port (PID $($proc.Id)). Log: $logFile"
  } else {
    Write-Output "STOPPED: no server tracked for port $Port"
  }
  exit 0
}

if ($Stop) {
  $proc = Get-RunningProc
  if (-not $proc) {
    Write-Output "Nothing to stop for port $Port."
    exit 0
  }
  Stop-Process -Id $proc.Id -Force
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  Write-Output "Stopped PID $($proc.Id)."
  exit 0
}

if ($Start) {
  $existing = Get-RunningProc
  if ($existing) {
    Write-Error "Already running on port $Port (PID $($existing.Id)). Stop it first with -Stop, or use a different -Port."
    exit 1
  }
  $exe = Resolve-Obscura
  $cliArgs = @("serve", "--port", $Port)
  if (-not $NoStealth) { $cliArgs += "--stealth" }

  $proc = Start-Process -FilePath $exe -ArgumentList $cliArgs `
    -RedirectStandardOutput $logFile -RedirectStandardError "$logFile.err" `
    -WindowStyle Hidden -PassThru
  Start-Sleep -Milliseconds 500
  if ($proc.HasExited) {
    Write-Error "obscura serve exited immediately (exit code $($proc.ExitCode)). Check $logFile / $logFile.err - a common cause is the port already being in use by something else."
    exit 1
  }
  Set-Content -Path $pidFile -Value $proc.Id
  Write-Output "Started obscura serve on port $Port (PID $($proc.Id)), stealth: $(if ($NoStealth) { 'OFF' } else { 'ON' })."
  Write-Output "Log: $logFile"
  Write-Output "CDP endpoint: ws://127.0.0.1:$Port"
  exit 0
}

Write-Output "Specify one of -Start, -Stop, -Status."
exit 2
