<#
.SYNOPSIS
    Membangun index (jika belum ada) dan menyalakan tgrep server untuk satu
    folder/repo, lalu memverifikasi statusnya.

.DESCRIPTION
    Jalankan sekali di awal sesi kerja, dari folder mana pun — path target
    diberikan lewat -Path. `tgrep serve` akan:
      - membangun index kalau belum ada (menjawab query kosong sampai build
        pertama selesai),
      - tetap berjalan di background dan memantau perubahan file,
      - menulis .tgrep/serve.json (PID + port) di dalam folder target.

    Pastikan .tgrep/ ditambahkan ke .gitignore folder target — skrip ini
    akan menambahkannya otomatis kalau belum ada.

.PARAMETER Path
    Folder/repo yang mau di-index dan dilayani. Default: direktori saat ini.

.PARAMETER ExtraArgs
    Flag tambahan yang diteruskan apa adanya ke 'tgrep serve', misalnya
    '--exclude', 'node_modules', '--no-require-git'. Harus konsisten dengan
    flag yang dipakai saat 'tgrep index' dan saat pencarian nanti.

.EXAMPLE
    .\start-tgrep-server.ps1 -Path C:\repos\big-monorepo

.EXAMPLE
    .\start-tgrep-server.ps1 -Path . -ExtraArgs @("--exclude","node_modules","--exclude","dist")
#>

[CmdletBinding()]
param(
    [string]$Path = ".",
    [string[]]$ExtraArgs = @()
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command tgrep -ErrorAction SilentlyContinue)) {
    Write-Error "tgrep tidak ditemukan di PATH. Jalankan install-tgrep.ps1 dulu."
    exit 1
}

$resolved = Resolve-Path $Path
Write-Host "== Menyalakan tgrep server untuk: $resolved ==" -ForegroundColor Cyan

# Tambahkan .tgrep/ ke .gitignore folder target kalau belum ada
$gitignore = Join-Path $resolved ".gitignore"
$ignoreLine = ".tgrep/"
if (Test-Path $gitignore) {
    $content = Get-Content $gitignore -Raw
    if ($content -notmatch [regex]::Escape($ignoreLine)) {
        Add-Content -Path $gitignore -Value "`n$ignoreLine"
        Write-Host "Menambahkan '$ignoreLine' ke .gitignore" -ForegroundColor DarkGray
    }
} else {
    Write-Host "Tidak ada .gitignore di folder ini — lewati (bukan repo git, atau .gitignore belum dibuat)." -ForegroundColor DarkGray
}

# Cek apakah sudah ada server jalan untuk folder ini.
# `tgrep status` selalu exit 0 baik untuk "no index", "index tanpa server",
# MAUPUN "server jalan" -- jadi exit code tidak bisa dipakai membedakan.
# Header "Server status for" HANYA muncul saat server benar-benar jalan;
# jangan cari substring "No server", itu tidak pernah ada di output apa pun.
$statusOutput = & tgrep status $resolved 2>&1
if ($LASTEXITCODE -eq 0 -and $statusOutput -match "Server status for") {
    Write-Host "Server sudah jalan untuk folder ini:" -ForegroundColor Green
    Write-Host $statusOutput
    exit 0
}

Write-Host "Menyalakan server baru (index dibangun di background jika belum ada)..."
$argList = @("serve", $resolved) + $ExtraArgs

# Jalankan sebagai proses terpisah supaya tidak memblokir terminal
Start-Process -FilePath "tgrep" -ArgumentList $argList -WindowStyle Hidden

Start-Sleep -Seconds 2
Write-Host "`nStatus setelah start:" -ForegroundColor Cyan
& tgrep status $resolved
