<#
.SYNOPSIS
    Memasang tgrep (https://github.com/microsoft/tgrep) di Windows.

.DESCRIPTION
    Urutan percobaan:
      1. Download binary rilis resmi lewat GitHub CLI (`gh`) — paling cepat,
         tidak butuh Rust toolchain.
      2. Kalau `gh` tidak ada / gagal, coba `cargo install` dari source
         (butuh Rust/cargo terpasang).
    Binary akan ditaruh di $HOME\.cargo\bin, lalu skrip mengecek apakah
    folder itu sudah ada di PATH.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install-tgrep.ps1
#>

[CmdletBinding()]
param(
    [string]$InstallDir = "$HOME\.cargo\bin"
)

$ErrorActionPreference = "Stop"

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "== Memasang tgrep ==" -ForegroundColor Cyan

if (Test-CommandExists "tgrep") {
    $existing = (tgrep --version) 2>$null
    Write-Host "tgrep sudah terpasang: $existing" -ForegroundColor Green
    exit 0
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$installed = $false

# --- Opsi 1: binary rilis resmi via GitHub CLI ---
if (Test-CommandExists "gh") {
    try {
        Write-Host "Mencoba download binary rilis resmi lewat 'gh release download'..."
        $tmp = Join-Path $env:TEMP ("tgrep-dl-" + [guid]::NewGuid())
        New-Item -ItemType Directory -Force -Path $tmp | Out-Null

        # PENTING: pola '*windows*' saja cocok dengan DUA asset sekaligus --
        # tgrep-vX-x86_64-pc-windows-msvc.zip DAN tgrep-vX-aarch64-pc-windows-msvc.zip
        # (keduanya mengandung substring "windows"). gh mengunduh keduanya, dan
        # Get-ChildItem lama memilih yang pertama secara alfabetis ("aarch64" < "x86_64"),
        # yang salah di hampir semua PC Windows -- terverifikasi nyata: binary ARM64
        # terpasang di mesin x86_64 dan gagal jalan ("not a valid application for
        # this OS platform"). x86_64 dipilih secara spesifik di sini karena berjalan
        # baik secara native di Windows x64 MAUPUN lewat emulasi x64 di Windows ARM64
        # (pola yang sama dipakai obscura-windows/setup_windows.ps1 di repo ini).
        gh release download --repo microsoft/tgrep -p '*x86_64*windows*' -D $tmp
        $zip = Get-ChildItem -Path $tmp -Filter "tgrep-*-x86_64-pc-windows-msvc.zip" | Select-Object -First 1

        if ($zip) {
            Expand-Archive -Path $zip.FullName -DestinationPath $InstallDir -Force
            $installed = $true
            Write-Host "Berhasil dipasang dari rilis resmi ke $InstallDir" -ForegroundColor Green
        } else {
            Write-Warning "Tidak menemukan file zip Windows x86_64 di rilis GitHub."
        }

        Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "Download rilis resmi gagal: $($_.Exception.Message)"
    }
} else {
    Write-Host "GitHub CLI ('gh') tidak ditemukan, lewati opsi download rilis." -ForegroundColor Yellow
}

# --- Opsi 2: build dari source via cargo ---
if (-not $installed) {
    if (Test-CommandExists "cargo") {
        Write-Host "Mencoba build dari source lewat cargo..."
        $src = Join-Path $env:TEMP ("tgrep-src-" + [guid]::NewGuid())

        if (Test-CommandExists "git") {
            git clone --depth 1 https://github.com/microsoft/tgrep.git $src
            Push-Location $src
            cargo install --path tgrep-cli --locked
            Pop-Location
            Remove-Item -Recurse -Force $src -ErrorAction SilentlyContinue
            $installed = $true
            Write-Host "Berhasil dibangun dari source dan dipasang lewat cargo." -ForegroundColor Green
        } else {
            Write-Error "Git tidak ditemukan — tidak bisa clone source untuk build cargo."
        }
    } else {
        Write-Error "Tidak ada 'gh' maupun 'cargo' yang terdeteksi. Pasang salah satunya dulu, atau download manual dari https://github.com/microsoft/tgrep/releases"
        exit 1
    }
}

# --- Cek PATH ---
# Catatan: JANGAN sarankan `setx PATH "...;$env:Path"` -- setx menimpa PATH
# user dan memotong di 1024 karakter, jadi bisa merusak/memangkas PATH milik
# user secara permanen kalau $env:Path (gabungan System+User) sudah panjang.
# [Environment]::SetEnvironmentVariable menambah ke PATH user tanpa risiko
# itu -- ini pola yang sama dipakai skill obscura-windows/pdf-inspector-windows.
$pathEntries = $env:Path -split ";"
if ($pathEntries -notcontains $InstallDir) {
    Write-Warning "$InstallDir belum ada di PATH untuk sesi ini."
    Write-Host "Menambahkan sementara untuk sesi PowerShell ini..."
    $env:Path = "$InstallDir;$env:Path"
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if (($userPath -split ";") -notcontains $InstallDir) {
        Write-Host "Menambahkan $InstallDir ke PATH user secara permanen (registry, tidak butuh admin)..." -ForegroundColor Yellow
        $newUserPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Write-Host "Selesai. Buka terminal baru agar PATH permanen ini terbaca oleh proses lain." -ForegroundColor Yellow
    }
}

Write-Host "`nVerifikasi instalasi:" -ForegroundColor Cyan
try {
    & "$InstallDir\tgrep.exe" --version
} catch {
    tgrep --version
}
