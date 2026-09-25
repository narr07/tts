<#
.SYNOPSIS
  Check, install, or update the Obscura headless browser binary on Windows.

.DESCRIPTION
  Downloads the official release zip from GitHub Releases into
  %LOCALAPPDATA%\obscura and adds that folder to the current user's PATH
  (registry-level, no admin rights needed). Nothing is installed
  system-wide and no Windows Service is created.

.PARAMETER Check
  Only report whether obscura is installed and on PATH; install nothing.

.PARAMETER Plain
  Install the NON-stealth build. By default the stealth build
  (anti-detection + tracker blocking, full rendering) is installed because
  the owner wants stealth always on. Use -Plain only on explicit request.

.PARAMETER NoRender
  Install the no-render build (smaller, no screenshots/PDF/CSS layout).
  Stealth is still included unless -Plain is also given. Most users want
  rendering.

.PARAMETER InstallDir
  Where to put the binaries. Default: $env:LOCALAPPDATA\obscura

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File setup_windows.ps1 -Check
  powershell -ExecutionPolicy Bypass -File setup_windows.ps1
  powershell -ExecutionPolicy Bypass -File setup_windows.ps1 -Plain
#>
param(
  [switch]$Check,
  [switch]$Plain,
  [switch]$NoRender,
  [string]$InstallDir = (Join-Path $env:LOCALAPPDATA "obscura")
)

$ErrorActionPreference = "Stop"
$exePath = Join-Path $InstallDir "obscura.exe"
$repo = "h4ckf0r0day/obscura"

function Get-CurrentVersion {
  if (-not (Test-Path $exePath)) { return $null }
  try {
    $out = & $exePath --version 2>$null
    return ($out | Select-Object -First 1)
  } catch { return $null }
}

function Test-OnUserPath {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  return ($userPath -and ($userPath -split ";" | Where-Object { $_.TrimEnd('\') -eq $InstallDir.TrimEnd('\') }))
}

if ($Check) {
  $ver = Get-CurrentVersion
  if ($ver) {
    $build = if (Test-Path (Join-Path $InstallDir "build.txt")) { (Get-Content (Join-Path $InstallDir "build.txt")) } else { "unknown" }
    Write-Output "OK: Obscura installed at $exePath ($ver), build: $build"
    if ($build -ne "stealth") {
      Write-Output "NOTE: stealth build is required (stealth must always be on). Rerun this script without -Check and without -Plain to upgrade."
    }
    if (-not (Test-OnUserPath)) {
      Write-Output "NOTE: $InstallDir is not on the user PATH yet. Rerun setup (without -Check) to fix, or call the full path."
    }
  } else {
    Write-Output "MISSING: Obscura not found at $exePath. Run this script without -Check to install."
  }
  exit ($(if ($ver) { 0 } else { 1 }))
}

# Determine asset suffix: none | -stealth | -no-render | -no-render-stealth
# Stealth is the default; -Plain opts out.
$Stealth = -not $Plain
$suffix = ""
if ($NoRender -and $Stealth) { $suffix = "-no-render-stealth" }
elseif ($NoRender)           { $suffix = "-no-render" }
elseif ($Stealth)            { $suffix = "-stealth" }
$buildMarker = Join-Path $InstallDir "build.txt"

$arch = if ([Environment]::Is64BitOperatingSystem) { "x86_64" } else {
  Write-Error "Obscura publishes only x86_64 Windows binaries. This machine is not 64-bit."
  exit 1
}
$assetName = "obscura-$arch-windows$suffix.zip"
$downloadUrl = "https://github.com/$repo/releases/latest/download/$assetName"

Write-Output "Downloading $assetName ..."
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
$zipPath = Join-Path $env:TEMP $assetName

try {
  Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
} catch {
  Write-Error ("Download failed from $downloadUrl`n" +
    "Check the asset name still matches a current release at " +
    "https://github.com/$repo/releases/latest, and check your network/proxy.")
  exit 1
}

Write-Output "Extracting to $InstallDir ..."
Expand-Archive -Path $zipPath -DestinationPath $InstallDir -Force
Remove-Item $zipPath -Force

if (-not (Test-Path $exePath)) {
  # Some archives may nest a folder; flatten if so.
  $found = Get-ChildItem -Path $InstallDir -Filter "obscura.exe" -Recurse | Select-Object -First 1
  if ($found) {
    Get-ChildItem -Path $found.DirectoryName | Move-Item -Destination $InstallDir -Force
  }
}
if (-not (Test-Path $exePath)) {
  Write-Error "obscura.exe not found after extraction. The release archive layout may have changed."
  exit 1
}

if (-not (Test-OnUserPath)) {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $newPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  Write-Output "Added $InstallDir to the user PATH. Open a new terminal for it to take effect."
}

Set-Content -Path $buildMarker -Value $(if ($Stealth) { "stealth" } else { "plain" })
$ver = & $exePath --version 2>$null
Write-Output "Done. Installed: $ver  (build: $(if ($Stealth) { 'stealth' } else { 'plain' }))"
Write-Output "Binary: $exePath"
Write-Output "obscura-worker.exe (needed for 'obscura scrape') should sit alongside it - verify with: Get-ChildItem `"$InstallDir`""
